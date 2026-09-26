// Perfumes of many more houses, added to the site.
//
//   node scripts/more-houses-sql.mjs [--min-votes 40] [--part-size 2500]
// (also reads data-import/houses-meta-*.json: gender and year per Fragrantica number)
//
// Reads data-import/houses-collected-*.json (one designer page per house from Fragrantica, collected slowly in the browser:
// { "<designer page name>": { status, list: [[id, name, brand, year, gender, votes], ...] } }), data-import/house-brands.json
// (designer page name -> the house name the site already uses) and the live catalogue (public, read-only), and writes:
//   data-import/more-houses-part-N.sql   for the OWNER to run in the Supabase SQL Editor (dry run first, one part at a time).
//                                       They only ADD the perfumes the site does not have yet (brand, name, gender, year).
//   data-import/fragrantica-image-ids.json + fragrantica-image-targets.json   get the new perfumes appended, most voted
//                                       first, so scripts/download-image-candidates.mjs --source fragrantica takes their pictures.
// Only perfumes with at least --min-votes votes are added (default 40): the very small releases nobody rated are left out.
// A perfume that the site already has under a line-name variant ("Emporio Armani X" for "X") is not added a second time.

import fs from 'node:fs';

const DIR = 'data-import';
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? Number(process.argv[i + 1]) : fallback; };
const MIN_VOTES = arg('--min-votes', 40);
const PART_SIZE = arg('--part-size', 2500);
const BLOCKED = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing in .env.local');

async function readAll(table, cols) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${base}/rest/v1/${table}?select=${cols}&order=id&offset=${from}&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Could not read ${table}: HTTP ${r.status}`);
    const page = await r.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '');
const words = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’`]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
const slugify = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const sqlText = s => `'${String(s).replace(/'/g, "''")}'`;
const parseVotes = v => { const m = /^([\d.,]+)(k?)$/i.exec(String(v ?? '')); if (!m) return 0; const n = parseFloat(m[1].replace(',', '.')); return Math.round(m[2] ? n * 1000 : n); };
const GENDER = { female: 'female', male: 'male', unisex: 'unisex' };
// "Emporio Armani Stronger With You" for "Stronger With You": the words of the house (and "emporio") in front do not make another perfume
const stripLead = (brand, name) => { const b = new Set(words(brand)); return words(name).filter((w, i, all) => !((b.has(w) || w === 'emporio') && all.slice(0, i).every(x => b.has(x) || x === 'emporio'))).join(''); };

const collected = {};
for (const f of fs.readdirSync(DIR).filter(f => /^houses-collected-.*\.json$/.test(f)).sort()) Object.assign(collected, JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')));
// Gender and year come from a second pass over the same pages (houses-meta-*.json: { "<designer page>": [[id, gender, year], ...] }):
// the first pass read them from a page layout that did not carry them.
const meta = new Map();
for (const f of fs.readdirSync(DIR).filter(f => /^houses-meta-.*\.json$/.test(f)).sort()) {
  for (const list of Object.values(JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')))) for (const [id, gender, year] of list) meta.set(id, { gender, year });
}
const houseBrand = new Map(JSON.parse(fs.readFileSync(`${DIR}/house-brands.json`, 'utf8')).map(h => [h.slug.toLowerCase(), h.brand]));

const [perfumes, dupes] = await Promise.all([readAll('perfumes', 'brand,name,gender,year'), readAll('dupes', 'brand,name')]);
const have = new Set([...perfumes, ...dupes].map(p => `${fold(p.brand)}|${fold(p.name)}`));
const firstWord = b => words(b)[0] ?? '';
const haveLine = new Map(); // "<first word of the house>|<name without the house words in front>" -> [{gender, year}]
for (const p of perfumes) {
  const k = `${firstWord(p.brand)}|${stripLead(p.brand, p.name)}`;
  haveLine.set(k, [...(haveLine.get(k) ?? []), { gender: p.gender, year: p.year }]);
}

const rows = [];
const report = [];
const seen = new Set();
let pages = 0;
for (const [slug, page] of Object.entries(collected)) {
  if (page.status !== 200) continue;
  pages++;
  const house = houseBrand.get(slug.toLowerCase());
  let added = 0, existing = 0, lowVotes = 0, skipped = 0;
  for (const [id, rawName, brand, year0, gender0, votesText] of page.list) {
    const year = year0 || meta.get(id)?.year || 0;
    const gender = gender0 || meta.get(id)?.gender || '';
    const name = String(rawName ?? '').replace(/\s+/g, ' ').trim();
    const houseName = house ?? String(brand ?? '').trim();
    if (!name || !houseName || BLOCKED.test(name) || name.length > 120) { skipped++; continue; }
    const votes = parseVotes(votesText);
    if (votes < MIN_VOTES) { lowVotes++; continue; }
    const g = GENDER[String(gender ?? '').toLowerCase()] ?? null;
    const y = year >= 1500 && year <= new Date().getFullYear() + 1 ? year : null;
    const k = `${fold(houseName)}|${fold(name)}`;
    if (have.has(k) || seen.has(k)) { existing++; continue; }
    const same = haveLine.get(`${firstWord(houseName)}|${stripLead(houseName, name)}`) ?? [];
    if (same.some(o => (!o.gender || !g || o.gender === g) && (!o.year || !y || o.year === y))) { existing++; continue; }
    seen.add(k);
    rows.push({ house: houseName, name, gender: g, year: y, votes, id });
    added++;
  }
  report.push(`${(house ?? '(new house)').slice(0, 28).padEnd(28)} on the page ${String(page.list.length).padStart(4)}  new ${String(added).padStart(4)}  already there ${String(existing).padStart(4)}  under ${MIN_VOTES} votes ${String(lowVotes).padStart(4)}`);
}
console.log(report.join('\n'));
console.log(`\n${pages} house pages, minimum ${MIN_VOTES} votes. Total new perfumes: ${rows.length}`);

rows.sort((a, b) => a.house.localeCompare(b.house) || a.name.localeCompare(b.name));
const parts = [];
for (let i = 0; i < rows.length; i += PART_SIZE) parts.push(rows.slice(i, i + PART_SIZE));
for (const [i, part] of parts.entries()) {
  const values = part.map(r => `    (${sqlText(r.house)}, ${sqlText(r.name)}, ${r.gender ? sqlText(r.gender) : 'NULL'}, ${r.year ?? 'NULL'})`).join(',\n');
  const sql = `-- =====================================================================
-- MatchScent: more perfumes of many houses, part ${i + 1} of ${parts.length} (${part.length} new perfumes)   (generated by scripts/more-houses-sql.mjs, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * It only ADDS perfumes (brand, name, gender, year) that are not on the site yet. It never changes or deletes
--    anything, and a perfume that is already there (same brand and name) is left as it is.
--  * All-or-nothing (a single transaction). Run the parts one after the other.
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
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would add % perfumes (of ${part.length}). Change dry_run to false to apply.', n_added;
  END IF;
  RAISE NOTICE 'Done: % perfumes added.', n_added;
END $$;

SELECT count(*) AS perfumes_on_the_site FROM public.perfumes;
`;
  fs.writeFileSync(`${DIR}/more-houses-part-${i + 1}.sql`, sql);
}
for (const f of fs.readdirSync(DIR).filter(f => /^more-houses-part-\d+\.sql$/.test(f))) {
  if (Number(/(\d+)/.exec(f)[1]) > parts.length) fs.unlinkSync(`${DIR}/${f}`);
}

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
console.log(`${parts.length} SQL part(s) written (data-import/more-houses-part-N.sql); ${queued} new perfumes queued for pictures (most voted first).`);
