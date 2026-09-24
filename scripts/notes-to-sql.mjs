// Turns the collected facts (note pyramids, year, perfumers, main accords) into a reviewable SQL script that
// fills the new columns of "perfumes" (and note_pyramid of "dupes").
//
//   node scripts/notes-to-sql.mjs
//
// Sources (all local, data-import/):
//   notes-collected.json + details-collected.json   from Fragrantica pages (made by merge-collected.mjs)
//   collected-parfumo-*.json                        from Parfumo pages: { "Brand|Name": { blocks, accords, year, perfumers } }
// Fragrantica wins when both know the fragrance.
//
// Output: data-import/notes.sql   (dry run first, all-or-nothing; the OWNER runs it, never Claude)
//         and, on screen, the notes / accords that still have no Hebrew name in src/lib/notes-he.ts.
//
// Run it only AFTER db-migrations/2026-09-community-v2-and-notes.sql and ...-community-v3-ratings-panels.sql.

import fs from 'node:fs';
import { ACCORDS_HE, NOTES_HE, NOTE_ADJECTIVES_HE } from '../src/lib/notes-he.ts';

const DIR = 'data-import';
const read = (f, d) => (fs.existsSync(`${DIR}/${f}`) ? JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')) : d);
const notes = read('notes-collected.json', {});       // Fragrantica number -> { "Top Notes": [{n, i}], ... }
const details = read('details-collected.json', {});   // Fragrantica number -> { year, perfumers, accords }
const ids = read('fragrantica-image-ids.json', {});   // slug -> Fragrantica number
const targets = read('fragrantica-image-targets.json', []); // { slug, brand, name, kind }

const HEADING_KEY = { top: 'top', heart: 'heart', base: 'base', 'top notes': 'top', 'middle notes': 'heart', 'heart notes': 'heart', 'base notes': 'base', notes: 'notes' };
const sqlText = s => `'${s.replace(/'/g, "''")}'`;
const sqlArray = list => `ARRAY[${list.map(sqlText).join(', ')}]::text[]`;
const clean = s => s.replace(/\s+/g, ' ').trim();

// Same lookup as noteLabel() in src/lib/notes.ts: the exact name, or a leading place/variety word + a known note.
const hasHebrew = key => {
  if (NOTES_HE[key]) return true;
  const words = key.split(/\s+/);
  for (let take = Math.min(2, words.length - 1); take >= 1; take--) {
    if (NOTE_ADJECTIVES_HE[words.slice(0, take).join(' ')] && NOTES_HE[words.slice(take).join(' ')]) return true;
  }
  return false;
};

const facts = new Map(); // "kind|brand|name" (lower case) -> { brand, name, kind, pyramid, year, perfumers, accords }
const put = (kind, brand, name, data) => {
  const key = `${kind}|${brand.toLowerCase()}|${name.toLowerCase()}`;
  if (!facts.has(key)) facts.set(key, { brand, name, kind, ...data });
};

// 1. Fragrantica
for (const t of targets) {
  const id = ids[t.slug];
  const groups = notes[id];
  const info = details[id] ?? {};
  if (!groups && !info.year) continue;
  const pyramid = {};
  for (const [heading, list] of Object.entries(groups ?? {})) {
    const key = HEADING_KEY[heading.toLowerCase()];
    if (key && list.length) pyramid[key] = list.map(x => clean(x.n));
  }
  put(t.kind === 'original' ? 'original' : 'inspired', t.brand, t.name, {
    pyramid: Object.keys(pyramid).length ? pyramid : null,
    year: info.year ?? null,
    perfumers: info.perfumers?.length ? info.perfumers : null,
    accords: info.accords?.length ? info.accords : null,
  });
}

// 2. Parfumo (only for fragrances Fragrantica did not give us)
for (const file of fs.readdirSync(DIR).filter(f => /^collected-parfumo-.*\.json$/.test(f)).sort()) {
  for (const [key, page] of Object.entries(read(file, {}))) {
    if (!page || page.nomatch || !page.blocks) continue;
    const [brand, name] = key.split('|');
    const pyramid = {};
    for (const [title, list] of page.blocks) {
      const k = HEADING_KEY[title.trim().toLowerCase()];
      if (k && list.length) pyramid[k] = list.map(clean);
    }
    put('original', brand, name, {
      pyramid: Object.keys(pyramid).length ? pyramid : null,
      year: page.year ?? null,
      perfumers: page.perfumers?.length ? page.perfumers : null,
      accords: page.accords?.length ? page.accords.map(a => a.toLowerCase()) : null,
    });
  }
}

const rows = [...facts.values()];
const originals = rows.filter(r => r.kind === 'original');
const inspired = rows.filter(r => r.kind === 'inspired' && r.pyramid);

const missingNotes = new Map();
const missingAccords = new Map();
for (const r of rows) {
  for (const list of Object.values(r.pyramid ?? {})) for (const n of list) if (!hasHebrew(n.toLowerCase())) missingNotes.set(n, (missingNotes.get(n) ?? 0) + 1);
  for (const a of r.accords ?? []) if (!ACCORDS_HE[a.toLowerCase()]) missingAccords.set(a, (missingAccords.get(a) ?? 0) + 1);
}

const perfumeValues = originals
  .map(r => `    (${sqlText(r.brand.toLowerCase())}, ${sqlText(r.name.toLowerCase())}, ${r.pyramid ? `${sqlText(JSON.stringify(r.pyramid))}::jsonb` : 'NULL::jsonb'}, ${r.year ?? 'NULL'}::smallint, ${r.perfumers ? sqlArray(r.perfumers) : 'NULL::text[]'}, ${r.accords ? sqlArray(r.accords.map(a => a.toLowerCase())) : 'NULL::text[]'})`)
  .join(',\n');
const dupeValues = inspired
  .map(r => `    (${sqlText(r.brand.toLowerCase())}, ${sqlText(r.name.toLowerCase())}, ${sqlText(JSON.stringify(r.pyramid))}::jsonb)`)
  .join(',\n');

const sql = `-- =====================================================================
-- MatchScent: fill in notes, year, perfumers and main accords          (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor, AFTER the two migrations
-- "2026-09-community-v2-and-notes.sql" and "2026-09-community-v3-ratings-panels.sql" (they create the columns).
--  * It starts as a DRY RUN (dry_run := true): it ends with a red message (EXPECTED) that says how many
--    rows it WOULD fill; nothing is saved. Then change to  dry_run := false  and run again.
--  * It only FILLS the new columns (note_pyramid, year, perfumers, accords) of ${originals.length} perfumes and note_pyramid of
--    ${inspired.length} "inspired by" fragrances. A value that is empty here never overwrites one that is already there.
--    Nothing is deleted. All-or-nothing.
-- =====================================================================
DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_perfumes int;
  n_dupes int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name IN ('note_pyramid', 'year', 'perfumers', 'accords') AND table_name IN ('perfumes', 'dupes')) < 5 THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. A column is missing - run the two migrations (community-v2-and-notes, community-v3-ratings-panels) first.';
  END IF;

  WITH v(b, n, p, y, pf, ac) AS (VALUES
${perfumeValues || "    ('', '', NULL::jsonb, NULL::smallint, NULL::text[], NULL::text[])"}
  )
  UPDATE public.perfumes t
  SET note_pyramid = COALESCE(v.p, t.note_pyramid),
      year = COALESCE(v.y, t.year),
      perfumers = COALESCE(v.pf, t.perfumers),
      accords = COALESCE(v.ac, t.accords)
  FROM v WHERE lower(t.brand) = v.b AND lower(t.name) = v.n;
  GET DIAGNOSTICS n_perfumes = ROW_COUNT;

  WITH v(b, n, p) AS (VALUES
${dupeValues || "    ('', '', NULL::jsonb)"}
  )
  UPDATE public.dupes t SET note_pyramid = COALESCE(v.p, t.note_pyramid) FROM v WHERE lower(t.brand) = v.b AND lower(t.name) = v.n;
  GET DIAGNOSTICS n_dupes = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would fill % perfumes and % "inspired by" entries.', n_perfumes, n_dupes;
  END IF;
END $$;

-- Only reached after a real run:
SELECT (SELECT count(*) FROM public.perfumes WHERE note_pyramid IS NOT NULL) AS perfumes_with_notes,
       (SELECT count(*) FROM public.perfumes WHERE year IS NOT NULL) AS perfumes_with_year,
       (SELECT count(*) FROM public.dupes WHERE note_pyramid IS NOT NULL) AS entries_with_notes;
`;

fs.writeFileSync(`${DIR}/notes.sql`, sql, 'utf8');
console.log(`notes.sql: ${originals.length} originals (${originals.filter(r => r.pyramid).length} with notes, ${originals.filter(r => r.year).length} with year) + ${inspired.length} inspired fragrances.`);
const show = m => [...m].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} (${c})`).join(', ');
console.log(missingNotes.size ? `Notes without a Hebrew name yet (${missingNotes.size}): ${show(missingNotes)}` : 'Every note has a Hebrew name.');
console.log(missingAccords.size ? `Accords without a Hebrew name yet (${missingAccords.size}): ${show(missingAccords)}` : 'Every accord has a Hebrew name.');
