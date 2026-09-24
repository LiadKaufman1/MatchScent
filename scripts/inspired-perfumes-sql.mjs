// Every "inspired by" fragrance becomes a perfume with its own page.
//
//   node scripts/inspired-perfumes-sql.mjs
//
// Reads the live catalogue (public, read-only) and writes data-import/inspired-perfumes.sql for the OWNER to
// run (dry run first; after db-migrations/2026-09-v5-every-fragrance-a-page.sql). The SQL:
//   1. adds a perfumes row for each inspired fragrance that is not a perfume yet (brand, name, picture, notes),
//   2. links every "dupes" entry to its perfume row (dupes.inspired_perfume_id).
// Names that differ only by accents, punctuation or a known brand alias ("By Kilian" = "Kilian") are
// treated as the same fragrance, so nothing is added twice. Nothing is deleted.

import fs from 'node:fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing in .env.local');

async function readAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${base}/rest/v1/${table}?select=${columns}&order=id&offset=${from}&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Could not read ${table}: HTTP ${r.status}`);
    const page = await r.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '');
// Brands that are written differently in different places but are the same house.
const BRAND_ALIASES = {
  bykilian: 'kilian', kilianparis: 'kilian',
  maisonmartinmargiela: 'maisonmargiela',
  initioparfumsprives: 'initio',
  jomalonelondon: 'jomalone',
  rabanne: 'pacorabanne',
};
const brandKey = b => { const k = fold(b); return BRAND_ALIASES[k] ?? k; };
const keyOf = (brand, name) => `${brandKey(brand)}|${fold(name)}`;
const sqlText = s => `'${String(s).replace(/'/g, "''")}'`;

async function run() {
  const [perfumes, dupes] = await Promise.all([
    readAll('perfumes', 'id,brand,name'),
    readAll('dupes', 'id,brand,name,image_url,note_pyramid'),
  ]);

  const perfumeByKey = new Map(perfumes.map(p => [keyOf(p.brand, p.name), p]));
  // The house name as the site already writes it ("Paco Rabanne", not "Rabanne").
  const brandSpelling = new Map(perfumes.map(p => [brandKey(p.brand), p.brand]));

  const toAdd = new Map();   // key -> { brand, name, image_url, note_pyramid }
  const links = new Map();   // "dupe brand|dupe name" (exact) -> { brand, name } of the perfume row
  for (const d of dupes) {
    const k = keyOf(d.brand, d.name);
    const existing = perfumeByKey.get(k);
    const target = existing
      ? { brand: existing.brand, name: existing.name }
      : (() => {
          const known = toAdd.get(k);
          if (known) {
            if (!known.image_url && d.image_url) known.image_url = d.image_url;
            if (!known.note_pyramid && d.note_pyramid) known.note_pyramid = d.note_pyramid;
            return { brand: known.brand, name: known.name };
          }
          const row = { brand: brandSpelling.get(brandKey(d.brand)) ?? d.brand, name: d.name, image_url: d.image_url ?? null, note_pyramid: d.note_pyramid ?? null };
          toAdd.set(k, row);
          return { brand: row.brand, name: row.name };
        })();
    links.set(`${d.brand}|${d.name}`, { dupeBrand: d.brand, dupeName: d.name, ...target });
  }

  const addRows = [...toAdd.values()]
    .map(r => `    (${sqlText(r.brand)}, ${sqlText(r.name)}, ${r.image_url ? sqlText(r.image_url) : 'NULL'}, ${r.note_pyramid ? `${sqlText(JSON.stringify(r.note_pyramid))}::jsonb` : 'NULL::jsonb'})`)
    .join(',\n');
  const linkRows = [...links.values()]
    .map(l => `    (${sqlText(l.dupeBrand.toLowerCase())}, ${sqlText(l.dupeName.toLowerCase())}, ${sqlText(l.brand.toLowerCase())}, ${sqlText(l.name.toLowerCase())})`)
    .join(',\n');
  const alreadyPerfumes = links.size - toAdd.size;

  const sql = `-- =====================================================================
-- MatchScent: a perfume row (= its own page) for every "inspired by" fragrance   (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor, AFTER
-- "db-migrations/2026-09-v5-every-fragrance-a-page.sql".
--  * DRY RUN first (dry_run := true): it ends with a red message (EXPECTED) with the numbers; nothing is saved.
--    Then change to  dry_run := false  and run again. All-or-nothing.
--  * Adds ${toAdd.size} perfumes (the inspired fragrances that are not perfumes yet; ${alreadyPerfumes} of the ${links.size} are already
--    perfumes on the site) and links every entry of the "inspired by" lists to its perfume.
--  * Deletes nothing and changes no existing perfume.
-- =====================================================================
DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_added int;
  n_linked int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dupes' AND column_name = 'inspired_perfume_id') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Run db-migrations/2026-09-v5-every-fragrance-a-page.sql first.';
  END IF;

  WITH v(b, n, img, notes) AS (VALUES
${addRows || "    ('', '', NULL, NULL::jsonb)"}
  )
  INSERT INTO public.perfumes (brand, name, image_url, note_pyramid)
  SELECT v.b, v.n, v.img, v.notes FROM v
  WHERE v.b <> '' AND NOT EXISTS (SELECT 1 FROM public.perfumes p WHERE lower(p.brand) = lower(v.b) AND lower(p.name) = lower(v.n));
  GET DIAGNOSTICS n_added = ROW_COUNT;

  WITH m(db, dn, pb, pn) AS (VALUES
${linkRows}
  )
  UPDATE public.dupes d SET inspired_perfume_id = p.id
  FROM m, public.perfumes p
  WHERE lower(d.brand) = m.db AND lower(d.name) = m.dn AND lower(p.brand) = m.pb AND lower(p.name) = m.pn;
  GET DIAGNOSTICS n_linked = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would add % perfumes and link % entries of the "inspired by" lists.', n_added, n_linked;
  END IF;
END $$;

-- Only reached after a real run:
SELECT (SELECT count(*) FROM public.perfumes) AS perfumes_now,
       (SELECT count(*) FROM public.dupes WHERE inspired_perfume_id IS NOT NULL) AS entries_linked,
       (SELECT count(*) FROM public.dupes WHERE inspired_perfume_id IS NULL) AS entries_not_linked_expected_0;
`;
  fs.writeFileSync('data-import/inspired-perfumes.sql', sql, 'utf8');
  console.log(`inspired-perfumes.sql: ${toAdd.size} perfumes to add, ${links.size} distinct inspired fragrances (${alreadyPerfumes} already perfumes), ${dupes.length} entries to link.`);
}

run().catch(e => { console.error(e.message); process.exitCode = 1; });
