// Turns text you copied from Fragrantica pages into "inspired by" entries for the site.
//
//   node scripts/fragrantica-import.mjs [input.txt] [--top 10]
//
// Input  (default data-import/fragrantica-30.txt): one "### N. Brand | Name" heading per
//        perfume, with the copied page text underneath.
// Output data-import/fragrantica-result.txt  (a readable report)
//        data-import/fragrantica-import.sql  (for the owner to review and run; never run by Claude)
//
// Rules (from the owner):
//   - use the "This perfume reminds me of" list
//   - never the same brand as the original perfume
//   - only fragrances with more likes than dislikes
//   - best first, by (likes - dislikes); keep the top 5 (or --top N, up to 15)
//   - at least MIN_VOTES votes, and not a supermarket/body-care line (EXCLUDED_BRANDS)
// One extra rule: several versions of the same fragrance from one brand (for example
// "Club de Nuit Intense Man" and its "Parfum" / "Limited Edition") count once, using the
// best-ranked one, so the top 5 are five different fragrances. Set COLLAPSE_VARIANTS to
// false below to turn this off.

import fs from 'node:fs';
import path from 'node:path';
import { MIN_VOTES, isExcludedBrand, norm, sameBrand, parseCount } from './lib/rules.mjs';

const COLLAPSE_VARIANTS = true;
// How many "inspired by" options to keep per perfume: --top 10 (default 5, at most 15).
const argv = process.argv.slice(2);
const topAt = argv.indexOf('--top');
const TOP = Math.min(Math.max(topAt > -1 ? parseInt(argv[topAt + 1], 10) || 5 : 5, 1), 15);
if (topAt > -1) argv.splice(topAt, 2);
// Stored in similarity_score so the site keeps this order: 100, 95, 90, 85, 80 for 5 options; 100, 96, 92, ... for more.
const SCORES = Array.from({ length: TOP }, (_, i) => (TOP <= 5 ? 100 - 5 * i : 100 - 4 * i));

// Pictures already on the site (scripts/prepare-site-images.mjs writes this list). An entry that has one is
// inserted WITH its picture, so re-importing never throws the pictures away.
const picturesFile = 'data-import/site-images/index.json';
const pictures = fs.existsSync(picturesFile) ? JSON.parse(fs.readFileSync(picturesFile, 'utf8')) : {};
const envText = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const supabaseUrl = envText.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
const pictureSlugs = new Map(Object.entries(pictures).map(([slug, v]) => [`${v.brand.toLowerCase()}|${v.name.toLowerCase()}`, slug]));
const pictureUrl = (brand, name) => {
  const slug = pictureSlugs.get(`${brand.toLowerCase()}|${name.toLowerCase()}`);
  return slug && supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/perfume-images/${slug}.jpg` : null;
};

const input = argv[0] || 'data-import/fragrantica-30.txt';
const outDir = path.dirname(input);
const now = new Date().toISOString();
const today = `${now.slice(0, 10).replace(/-/g, '')}_${now.slice(11, 16).replace(':', '')}`; // date + time, so a re-run never clashes with an older backup

const sqlText = s => `'${s.replace(/'/g, "''")}'`;

// ---- read the sections ---------------------------------------------------------
const lines = fs.readFileSync(input, 'utf8').split(/\r?\n/);
const sections = [];
for (let i = 0; i < lines.length; i++) {
  const m = /^### (\d+)\.\s+(.+?)\s+\|\s+(.+)$/.exec(lines[i]);
  if (m) sections.push({ n: Number(m[1]), brand: m[2], name: m[3], start: i + 1, end: lines.length });
}
sections.forEach((s, i) => { if (sections[i + 1]) s.end = sections[i + 1].start - 1; });

// ---- parse the "reminds me of" list of one section -----------------------------
function parseSection(sec) {
  const body = lines.slice(sec.start, sec.end).map(l => l.trim());
  const heading = body.findIndex(l => l === 'This perfume reminds me of');
  if (heading === -1) return { status: body.some(l => l && !l.startsWith('Search:')) ? 'no-list' : 'empty', items: [] };

  // walk the non-empty lines after the heading
  const rest = body.slice(heading + 1).filter(l => l !== '');
  let i = rest[0] === 'Suggest' ? 1 : 0;
  const items = [];
  while (i < rest.length && rest[i].startsWith('perfume ')) {
    const brand = rest[i + 1], name = rest[i + 2], likes = parseCount(rest[i + 3] ?? ''), dislikes = parseCount(rest[i + 4] ?? '');
    if (!brand || !name || likes === null || dislikes === null || rest[i + 5] !== 'Compare') break;
    items.push({ brand, name, likes, dislikes, diff: likes - dislikes });
    i += 6;
  }
  return { status: 'ok', items };
}

// ---- apply the rules -----------------------------------------------------------
function choose(sec, items) {
  const log = [];
  let pool = items.map(it => ({ ...it, note: '' }));

  for (const it of pool) {
    if (sameBrand(it.brand, sec.brand)) it.note = `removed: same brand (${it.brand})`;
    else if (isExcludedBrand(it.brand)) it.note = `removed: budget/retail line (${it.brand})`;
    else if (it.diff <= 0) it.note = 'removed: not more likes than dislikes';
    else if (it.likes + it.dislikes < MIN_VOTES) it.note = `removed: only ${it.likes + it.dislikes} votes`;
  }
  const eligible = pool.filter(it => !it.note).sort((a, b) => b.diff - a.diff || b.likes - a.likes);

  const kept = [];
  for (const it of eligible) {
    if (COLLAPSE_VARIANTS) {
      const nn = norm(it.name);
      const twin = kept.find(k => sameBrand(k.brand, it.brand) && ((' ' + nn + ' ').includes(' ' + norm(k.name) + ' ') || (' ' + norm(k.name) + ' ').includes(' ' + nn + ' ')));
      if (twin) { it.note = `removed: another version of "${twin.name}"`; continue; }
    }
    if (kept.length < TOP) { it.note = `KEPT #${kept.length + 1}`; kept.push(it); }
    else it.note = `not in the top ${TOP}`;
  }
  return { pool, kept, log };
}

// ---- run -----------------------------------------------------------------------
let report = `Fragrantica import report (${new Date().toISOString().slice(0, 10)})\nInput: ${input}\n`;
const results = [];

// Lists that were collected by Claude (instead of pasted by hand) are read from here.
const scrapedPath = path.join(outDir, 'fragrantica-scraped.json');
const scraped = fs.existsSync(scrapedPath) ? JSON.parse(fs.readFileSync(scrapedPath, 'utf8')) : {};

for (const sec of sections) {
  let parsed = parseSection(sec);
  if (parsed.status === 'empty' && scraped[sec.n]) {
    parsed = {
      status: 'ok',
      items: scraped[sec.n].items.map(([brand, name, l, d]) => {
        const likes = parseCount(l), dislikes = parseCount(d);
        return { brand, name, likes, dislikes, diff: likes - dislikes };
      }),
    };
  }
  const label = `#${sec.n} ${sec.brand} | ${sec.name}`;
  if (parsed.status === 'empty') { report += `\n${label}: nothing pasted yet (skipped)\n`; continue; }
  if (parsed.status === 'no-list' || parsed.items.length === 0) { report += `\n${label}: text pasted, but no "This perfume reminds me of" list found - please check\n`; continue; }

  const { pool, kept } = choose(sec, parsed.items);
  results.push({ sec, kept });
  report += `\n${label}: read ${parsed.items.length} fragrances -> keeping ${kept.length}\n`;
  for (const it of [...pool].sort((a, b) => b.diff - a.diff)) {
    report +=`   ${String(it.diff).padStart(6)}  ${it.likes}/${it.dislikes}`.padEnd(24) + `${it.brand} - ${it.name}   [${it.note}]\n`;
  }
}

const short = results.filter(r => r.kept.length < TOP);
report += `
SUMMARY: ${results.length} perfumes, ${results.reduce((n, r) => n + r.kept.length, 0)} entries; ${short.length} perfumes have fewer than ${TOP}: ${short.map(r => r.sec.brand + ' ' + r.sec.name + ' (' + r.kept.length + ')').join(', ')}
`;
fs.writeFileSync(path.join(outDir, 'fragrantica-result.txt'), report, 'utf8');

// ---- SQL (dry run by default) ----------------------------------------------------
if (results.length) {
  const backup = `dupes_backup_fragrantica_${today}`;
  const pairs = results.map(r => `(${sqlText(r.sec.brand.toLowerCase())}, ${sqlText(r.sec.name.toLowerCase())})`).join(', ');
  let sql = `-- =====================================================================
-- MatchScent: "inspired by" entries from Fragrantica lists   (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; it holds the summary numbers and NOTHING is saved.
--  * If the summary looks right, change  dry_run := true  to  dry_run := false  and run again.
--  * It is all-or-nothing: if anything fails, nothing changes. Backup of the old entries first.
--
-- For the ${results.length} perfume(s) below it:
--   1. copies the existing entries to ${backup} (public access off),
--   2. deletes the existing entries of those perfumes (they were unverified),
--   3. adds the entries chosen from the Fragrantica lists (no prices/photos yet; the
--      similarity_score only keeps the order: 100 = first).
-- The table structure is not changed, apart from the backup table.
-- =====================================================================

DO $$
DECLARE
  dry_run     boolean := true;   -- <<< change to false to APPLY
  target_ids  uuid[];
  missing     text;
  n_deleted   int;
  n_inserted  int := 0;
  pid         uuid;
BEGIN
  -- make sure the tables are looked up in the "public" schema (some SQL editors do not)
  PERFORM set_config('search_path', 'public, extensions', true);

  -- the perfumes we are about to fill (all copies with the same brand + name)
  SELECT array_agg(p.id) INTO target_ids
  FROM perfumes p
  WHERE (lower(p.brand), lower(p.name)) IN (${pairs});

  -- every perfume must exist, otherwise stop
  SELECT string_agg(t.b || ' | ' || t.n, ', ') INTO missing
  FROM (VALUES ${results.map(r => `(${sqlText(r.sec.brand.toLowerCase())}, ${sqlText(r.sec.name.toLowerCase())})`).join(', ')}) AS t(b, n)
  WHERE NOT EXISTS (SELECT 1 FROM perfumes p WHERE lower(p.brand) = t.b AND lower(p.name) = t.n);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Not found in the perfumes table: %', missing;
  END IF;

  -- 1. backup of the entries we replace
  EXECUTE format('CREATE TABLE ${backup} AS SELECT * FROM dupes WHERE original_perfume_id = ANY (%L)', target_ids);
  ALTER TABLE ${backup} ENABLE ROW LEVEL SECURITY;

  -- 2. remove the old entries of those perfumes
  DELETE FROM dupes WHERE original_perfume_id = ANY (target_ids);
  GET DIAGNOSTICS n_deleted = ROW_COUNT;

`;
  for (const r of results) {
    sql += `  -- ${r.sec.brand} | ${r.sec.name}\n`;
    sql += `  SELECT id INTO pid FROM perfumes WHERE lower(brand) = ${sqlText(r.sec.brand.toLowerCase())} AND lower(name) = ${sqlText(r.sec.name.toLowerCase())} ORDER BY created_at DESC LIMIT 1;\n`;
    r.kept.forEach((k, idx) => {
      const pic = pictureUrl(k.brand, k.name);
      sql += pic
        ? `  INSERT INTO dupes (original_perfume_id, name, brand, similarity_score, image_url) VALUES (pid, ${sqlText(k.name)}, ${sqlText(k.brand)}, ${SCORES[idx]}, ${sqlText(pic)});\n`
        : `  INSERT INTO dupes (original_perfume_id, name, brand, similarity_score) VALUES (pid, ${sqlText(k.name)}, ${sqlText(k.brand)}, ${SCORES[idx]});\n`;
      sql += `  n_inserted := n_inserted + 1;\n`;
    });
    sql += '\n';
  }
  sql += `  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Perfumes filled: ${results.length}. Old entries replaced: %. New entries added: %.', n_deleted, n_inserted;
  END IF;
END $$;

-- Only reached after a real run: shows the new entries.
SELECT p.brand AS perfume_brand, p.name AS perfume, d.brand AS inspired_brand, d.name AS inspired_name, d.similarity_score
FROM public.dupes d JOIN public.perfumes p ON p.id = d.original_perfume_id
WHERE (lower(p.brand), lower(p.name)) IN (${pairs})
ORDER BY p.brand, p.name, d.similarity_score DESC;
`;
  fs.writeFileSync(path.join(outDir, 'fragrantica-import.sql'), sql, 'utf8');
}

console.log(report);
console.log(results.length ? `SQL written to ${path.join(outDir, 'fragrantica-import.sql')}` : 'Nothing to import yet.');
