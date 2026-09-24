// The list of every perfume house, for the A-Z houses page.
//
//   node scripts/brands-sql.mjs
//
// Reads data-import/fragrantica-designers.json (house names collected from Fragrantica's designer index,
// local only) and writes data-import/brands.sql for the OWNER to run (dry run first; after
// db-migrations/2026-09-v5-every-fragrance-a-page.sql). Only names are stored, with our own web address
// for each. It adds rows only; a house that is already in the table is left as it is.

import fs from 'node:fs';

const slugify = text => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/['’`]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// The same words the site never shows (src/lib/catalog.ts).
const BLOCKED_WORDS = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;

const designers = JSON.parse(fs.readFileSync('data-import/fragrantica-designers.json', 'utf8'));
const bySlug = new Map();
let skipped = 0;
for (const { name: raw, count } of Object.values(designers)) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim();
  const slug = slugify(name);
  if (!slug || slug.length > 120 || name.length > 120 || BLOCKED_WORDS.test(name)) { skipped++; continue; }
  const old = bySlug.get(slug);
  if (!old || count > old.count) bySlug.set(slug, { slug, name, count });
}
const rows = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const q = s => `'${s.replace(/'/g, "''")}'`;

const sql = `-- =====================================================================
-- MatchScent: the list of perfume houses (${rows.length} houses)   (generated, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor,
-- AFTER db-migrations/2026-09-v5-every-fragrance-a-page.sql.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * It only ADDS names to the "brands" table; a house that is already there is left as it is.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_added int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Run db-migrations/2026-09-v5-every-fragrance-a-page.sql first.';
  END IF;

  INSERT INTO public.brands (slug, name) VALUES
${rows.map(r => `    (${q(r.slug)}, ${q(r.name)})`).join(',\n')}
  ON CONFLICT (slug) DO NOTHING;
  GET DIAGNOSTICS n_added = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would add % houses (of ${rows.length}). Change dry_run to false to apply.', n_added;
  END IF;
  RAISE NOTICE 'Done: % houses added.', n_added;
END $$;

SELECT count(*) AS houses_in_table FROM public.brands;
`;
fs.writeFileSync('data-import/brands.sql', sql);
console.log(`brands.sql: ${rows.length} houses (${skipped} skipped: no Latin letters/too long/blocked word).`);
