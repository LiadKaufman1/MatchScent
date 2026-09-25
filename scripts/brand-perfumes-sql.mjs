// Every perfume of chosen houses, added to the site.
//
//   node scripts/brand-perfumes-sql.mjs
//
// Reads data-import/brand-perfumes.json (one page per house from Fragrantica's designer pages, collected slowly in the
// browser: { "<designer page name>": [{ id, slug, name, brand, year, gender, votes }] }) and the live catalogue
// (public, read-only), and writes:
//   data-import/brand-perfumes.sql      for the OWNER to run in the Supabase SQL Editor (dry run first). It only ADDS
//                                       the perfumes the site does not have yet (brand, name, gender, year); nothing is
//                                       changed or deleted.
//   data-import/fragrantica-image-ids.json + fragrantica-image-targets.json   get the new perfumes appended, most voted
//                                       first, so scripts/download-image-candidates.mjs --source fragrantica takes the
//                                       pictures of the best known ones first (about 300 a day).
// The house is written as the site already writes it (Dior, Tom Ford, Yves Saint Laurent ...).

import fs from 'node:fs';

const DIR = 'data-import';
const HOUSES = {
  // Fragrantica designer page: the name the site uses for the house
  'Afnan': 'Afnan',
  'Lattafa-Perfumes': 'Lattafa Perfumes',
  'Armaf': 'Armaf',
  'Yves-Saint-Laurent': 'Yves Saint Laurent',
  'Giorgio-Armani': 'Giorgio Armani',
  'Dior': 'Dior',
  'Hugo-Boss': 'Hugo Boss',
  'Tom-Ford': 'Tom Ford',
  'Creed': 'Creed',
  'Maison-Francis-Kurkdjian': 'Maison Francis Kurkdjian',
  'Jo-Malone-London': 'Jo Malone London',
  'Narciso-Rodriguez': 'Narciso Rodriguez',
  'French-Avenue': 'French Avenue',
};
// The words the site never shows.
const BLOCKED = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing in .env.local');

async function readAll(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${base}/rest/v1/${table}?select=brand,name&order=id&offset=${from}&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Could not read ${table}: HTTP ${r.status}`);
    const page = await r.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '');
const slugify = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const sqlText = s => `'${String(s).replace(/'/g, "''")}'`;
const parseVotes = v => { const m = /^([\d.,]+)(k?)$/i.exec(String(v ?? '')); if (!m) return 0; const n = parseFloat(m[1].replace(',', '.')); return Math.round(m[2] ? n * 1000 : n); };
const GENDER = { female: 'female', male: 'male', unisex: 'unisex' };

const collected = JSON.parse(fs.readFileSync(`${DIR}/brand-perfumes.json`, 'utf8'));
const [perfumes, dupes] = await Promise.all([readAll('perfumes'), readAll('dupes')]);
const have = new Set([...perfumes, ...dupes].map(p => `${fold(p.brand)}|${fold(p.name)}`));

const nextYear = new Date().getFullYear() + 1;
const rows = [];
const report = [];
const seen = new Set();
for (const [page, list] of Object.entries(collected)) {
  const house = HOUSES[page];
  if (!house) { console.log(`skipped unknown house page: ${page}`); continue; }
  let added = 0, existing = 0, skipped = 0;
  for (const p of list) {
    const name = String(p.name ?? '').replace(/\s+/g, ' ').trim();
    if (!name || BLOCKED.test(name) || name.length > 120) { skipped++; continue; }
    const k = `${fold(house)}|${fold(name)}`;
    if (have.has(k) || seen.has(k)) { existing++; continue; }
    seen.add(k);
    rows.push({ house, name, gender: GENDER[String(p.gender ?? '').toLowerCase()] ?? null, year: p.year >= 1500 && p.year <= nextYear ? p.year : null, votes: parseVotes(p.votes), id: p.id });
    added++;
  }
  report.push(`${house.padEnd(26)} on the page ${String(list.length).padStart(4)}   already on the site ${String(existing).padStart(4)}   new ${String(added).padStart(4)}   skipped ${skipped}`);
}
console.log(report.join('\n'));
console.log(`\nTotal new perfumes: ${rows.length}`);

const values = rows
  .sort((a, b) => a.house.localeCompare(b.house) || a.name.localeCompare(b.name))
  .map(r => `    (${sqlText(r.house)}, ${sqlText(r.name)}, ${r.gender ? sqlText(r.gender) : 'NULL'}, ${r.year ?? 'NULL'})`)
  .join(',\n');

const sql = `-- =====================================================================
-- MatchScent: every perfume of ${Object.keys(HOUSES).length} houses (${rows.length} new perfumes)   (generated by scripts/brand-perfumes-sql.mjs, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * It only ADDS perfumes (brand, name, gender, year) that are not on the site yet. It never changes or deletes
--    anything, and a perfume that is already there (same brand and name) is left as it is.
--  * The houses: ${Object.values(HOUSES).join(', ')}.
--  * All-or-nothing (a single transaction).
-- =====================================================================
DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_added int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  WITH v(b, n, g, y) AS (VALUES
${values}
  )
  INSERT INTO public.perfumes (brand, name, gender, year)
  SELECT v.b, v.n, v.g, v.y::smallint FROM v
  WHERE NOT EXISTS (SELECT 1 FROM public.perfumes p WHERE lower(p.brand) = lower(v.b) AND lower(p.name) = lower(v.n));
  GET DIAGNOSTICS n_added = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would add % perfumes (of ${rows.length}). Change dry_run to false to apply.', n_added;
  END IF;
  RAISE NOTICE 'Done: % perfumes added.', n_added;
END $$;

SELECT brand, count(*) AS perfumes FROM public.perfumes GROUP BY brand ORDER BY count(*) DESC LIMIT 20;
`;
fs.writeFileSync(`${DIR}/brand-perfumes.sql`, sql);

// picture queue: the new perfumes, most voted first
const idsFile = `${DIR}/fragrantica-image-ids.json`, targetsFile = `${DIR}/fragrantica-image-targets.json`;
const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
const targets = JSON.parse(fs.readFileSync(targetsFile, 'utf8'));
const known = new Set(targets.map(t => t.slug));
let queued = 0;
for (const r of [...rows].sort((a, b) => b.votes - a.votes)) {
  const slug = slugify(`${r.house} ${r.name}`);
  if (!slug || known.has(slug)) continue;
  known.add(slug);
  ids[slug] = r.id;
  targets.push({ slug, brand: r.house, name: r.name, kind: 'original' });
  queued++;
}
fs.writeFileSync(idsFile, JSON.stringify(ids));
fs.writeFileSync(targetsFile, JSON.stringify(targets));
console.log(`brand-perfumes.sql written; ${queued} new perfumes queued for pictures (most voted first).`);
