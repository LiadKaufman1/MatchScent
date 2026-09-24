// Turns the collected note pyramids (data-import/notes-collected.json, made by merge-collected.mjs) into a
// reviewable SQL script that fills the new "note_pyramid" column of perfumes and dupes.
//
//   node scripts/notes-to-sql.mjs
//
// Output: data-import/notes.sql   (dry run first, all-or-nothing; the OWNER runs it, never Claude)
//         and, on screen, the notes that still have no Hebrew name in src/lib/notes-he.ts.
//
// Run it only AFTER db-migrations/2026-09-community-v2-and-notes.sql (it creates the column).

import fs from 'node:fs';
import { NOTES_HE, NOTE_ADJECTIVES_HE } from '../src/lib/notes-he.ts';

const DIR = 'data-import';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'));
const notes = read('notes-collected.json');        // Fragrantica number -> { "Top Notes": [{n, i}], ... }
const ids = read('fragrantica-image-ids.json');     // slug -> Fragrantica number
const targets = read('fragrantica-image-targets.json'); // { slug, brand, name, kind }

const KEY = { 'Top Notes': 'top', 'Middle Notes': 'heart', 'Base Notes': 'base', Notes: 'notes' };
const sqlText = s => `'${s.replace(/'/g, "''")}'`;

// Same lookup as noteLabel() in src/lib/notes.ts: the exact name, or a leading place/variety word + a known note.
const hasHebrew = key => {
  if (NOTES_HE[key]) return true;
  const words = key.split(/\s+/);
  for (let take = Math.min(2, words.length - 1); take >= 1; take--) {
    if (NOTE_ADJECTIVES_HE[words.slice(0, take).join(' ')] && NOTES_HE[words.slice(take).join(' ')]) return true;
  }
  return false;
};

const rows = []; // { brand, name, kind, pyramid }
const seen = new Set();
const missing = new Map(); // English note -> how many times it appears without a Hebrew name
for (const t of targets) {
  const groups = notes[ids[t.slug]];
  if (!groups) continue;
  const pyramid = {};
  for (const [heading, list] of Object.entries(groups)) {
    const key = KEY[heading];
    if (!key || !list.length) continue;
    pyramid[key] = list.map(x => x.n.replace(/\s+/g, ' ').trim());
  }
  if (!Object.keys(pyramid).length) continue;
  const dedupe = `${t.kind}|${t.brand.toLowerCase()}|${t.name.toLowerCase()}`;
  if (seen.has(dedupe)) continue;
  seen.add(dedupe);
  rows.push({ brand: t.brand, name: t.name, kind: t.kind, pyramid });
  for (const list of Object.values(pyramid)) for (const n of list) {
    const k = n.toLowerCase();
    if (!hasHebrew(k)) missing.set(n, (missing.get(n) ?? 0) + 1);
  }
}

const originals = rows.filter(r => r.kind === 'original');
const inspired = rows.filter(r => r.kind !== 'original');
const values = list => list
  .map(r => `    (${sqlText(r.brand.toLowerCase())}, ${sqlText(r.name.toLowerCase())}, ${sqlText(JSON.stringify(r.pyramid))}::jsonb)`)
  .join(',\n');

const sql = `-- =====================================================================
-- MatchScent: fill in the scent notes (top / heart / base)          (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor, AFTER the
-- "2026-09-community-v2-and-notes.sql" migration (that one creates the note_pyramid column).
--  * It starts as a DRY RUN (dry_run := true): it ends with a red message (EXPECTED) that says how many
--    rows it WOULD fill; nothing is saved. Then change to  dry_run := false  and run again.
--  * It only fills the EMPTY note_pyramid column of perfumes (${originals.length} fragrances) and dupes (${inspired.length} fragrances).
--    It never changes any other column and deletes nothing. All-or-nothing.
-- =====================================================================
DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_perfumes int;
  n_dupes int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'perfumes' AND column_name = 'note_pyramid') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The column note_pyramid does not exist yet - run 2026-09-community-v2-and-notes.sql first.';
  END IF;

  WITH v(b, n, p) AS (VALUES
${values(originals) || "    ('', '', NULL::jsonb)"}
  )
  UPDATE public.perfumes t SET note_pyramid = v.p FROM v WHERE lower(t.brand) = v.b AND lower(t.name) = v.n;
  GET DIAGNOSTICS n_perfumes = ROW_COUNT;

  WITH v(b, n, p) AS (VALUES
${values(inspired) || "    ('', '', NULL::jsonb)"}
  )
  UPDATE public.dupes t SET note_pyramid = v.p FROM v WHERE lower(t.brand) = v.b AND lower(t.name) = v.n;
  GET DIAGNOSTICS n_dupes = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would fill the notes of % perfumes and % "inspired by" entries.', n_perfumes, n_dupes;
  END IF;
END $$;

-- Only reached after a real run:
SELECT (SELECT count(*) FROM public.perfumes WHERE note_pyramid IS NOT NULL) AS perfumes_with_notes,
       (SELECT count(*) FROM public.dupes WHERE note_pyramid IS NOT NULL) AS entries_with_notes;
`;

fs.writeFileSync(`${DIR}/notes.sql`, sql, 'utf8');
console.log(`notes.sql: ${originals.length} originals + ${inspired.length} inspired fragrances with notes.`);
console.log(missing.size ? `Notes without a Hebrew name yet (${missing.size}):\n  ${[...missing].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} (${c})`).join('\n  ')}` : 'Every note has a Hebrew name.');
