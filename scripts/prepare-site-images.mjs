// Turns the downloaded candidate pictures into the pictures that go on the site, and writes the SQL that
// connects them to the perfumes. Reads only local files; changes nothing on the site or in the database.
//
//   node scripts/prepare-site-images.mjs
//
// For every perfume/entry in data-import/images/manifest.json it picks ONE picture (the Fragrantica one when
// there is one, otherwise the first search result), cuts away the empty border, puts the bottle in the middle
// of a white 800x1000 canvas (the shape the site shows it in) and saves a small JPEG:
//
//   data-import/site-images/<slug>.jpg        the pictures to upload (scripts/upload-site-images.mjs)
//   data-import/site-images/index.json        what was picked for whom, and where it came from
//   data-import/site-images/sheet-N.jpg       contact sheets, to look over the result quickly
//   data-import/site-images.sql               dry-run SQL (owner runs it) that sets image_url on the perfumes/entries
//
// The public address of a picture is  <Supabase URL>/storage/v1/object/public/perfume-images/<slug>.jpg

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'data-import/images';
const OUT = 'data-import/site-images';
const BUCKET = 'perfume-images';
const W = 800, H = 1000;
const BOX_W = Math.round(W * 0.8), BOX_H = Math.round(H * 0.78); // margins keep the bottle inside a square crop too

const env = {};
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
// Date + time in the backup table's name, so running the SQL again on another day/hour never clashes with an older backup.
const STAMP = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '_');
const publicUrl = slug => `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${slug}.jpg`;

const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const targets = JSON.parse(fs.readFileSync('data-import/fragrantica-image-targets.json', 'utf8'));
const kindOf = Object.fromEntries(targets.map(t => [t.slug, t.kind]));

// Originals that are not in the 200-target list (the first 20 came from the search run) are still originals.
const sqlText = s => `'${s.replace(/'/g, "''")}'`;

async function normalize(file) {
  const flat = sharp(file, { failOn: 'none' }).rotate().flatten({ background: '#ffffff' });
  // trim() takes the colour of the top-left corner as the "empty" background, so grey studio backgrounds are cut away too
  const trimmed = await flat.trim({ threshold: 14 }).toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  if (width < 120 || height < 120) throw new Error(`too small after trimming (${width}x${height})`);
  const bottle = await sharp(trimmed.data).resize(BOX_W, BOX_H, { fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([{ input: bottle, gravity: 'center' }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

// Incremental by default: a picture that was already normalised (it is in index.json and its file exists) is kept, so a
// run after a new download only works on the new pictures. --fresh starts from scratch.
const fresh = process.argv.includes('--fresh');
const indexFile = path.join(OUT, 'index.json');
const old = !fresh && fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
if (fresh) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const stale of fs.readdirSync(OUT).filter(x => /^sheet-\d+\.(jpg|txt)$/.test(x))) fs.unlinkSync(path.join(OUT, stale));

const index = {};
const problems = [];
for (const [slug, entry] of Object.entries(manifest)) {
  if (old[slug] && fs.existsSync(path.join(OUT, `${slug}.jpg`))) { index[slug] = { ...old[slug], kind: kindOf[slug] || old[slug].kind }; continue; }
  const files = [...(entry.files || [])].sort((a, b) => (b.source === 'fragrantica') - (a.source === 'fragrantica'));
  let picked = null;
  for (const f of files) {
    try {
      const buf = await normalize(path.join(SRC, f.file));
      fs.writeFileSync(path.join(OUT, `${slug}.jpg`), buf);
      picked = { file: f.file, source: f.source || 'search', imageUrl: f.imageUrl, pageUrl: f.pageUrl, bytes: buf.length };
      break;
    } catch (e) {
      problems.push(`${slug}: ${f.file} skipped (${e.message})`);
    }
  }
  if (picked) index[slug] = { brand: entry.brand, name: entry.name, kind: kindOf[slug] || 'original', ...picked };
  else problems.push(`${slug}: no usable picture`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1), 'utf8');

// ---- contact sheets (40 per sheet) ------------------------------------------------------------------
const slugs = Object.keys(index).filter(slug => !old[slug]).sort(); // contact sheets only for the new pictures
const TW = 200, TH = 250, COLS = 8, PER = 40;
for (let s = 0; s * PER < slugs.length; s++) {
  const chunk = slugs.slice(s * PER, (s + 1) * PER);
  const rows = Math.ceil(chunk.length / COLS);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const thumb = await sharp(path.join(OUT, `${chunk[i]}.jpg`)).resize(TW - 6, TH - 6).toBuffer();
    comps.push({ input: thumb, left: (i % COLS) * TW + 3, top: Math.floor(i / COLS) * TH + 3 });
  }
  await sharp({ create: { width: COLS * TW, height: rows * TH, channels: 3, background: '#d9d0cc' } })
    .composite(comps).jpeg({ quality: 80 }).toFile(path.join(OUT, `sheet-${s + 1}.jpg`));
  fs.writeFileSync(path.join(OUT, `sheet-${s + 1}.txt`), chunk.map((c, i) => `${i + 1}. ${index[c].brand} | ${index[c].name}`).join('\n') + '\n', 'utf8');
}

// ---- SQL --------------------------------------------------------------------------------------------------
const rows = kind => Object.entries(index)
  .filter(([, v]) => (kind === 'original') === (v.kind === 'original'))
  .map(([slug, v]) => `    (${sqlText(v.brand.toLowerCase())}, ${sqlText(v.name.toLowerCase())}, ${sqlText(publicUrl(slug))})`);
const pRows = rows('original'), dRows = rows('inspired');

// One script per PART_SIZE perfumes (a single script with thousands of rows is too big to paste into the SQL Editor).
// Part 1 also carries the entries (similar scents). Run the parts one after the other; each keeps its own backup table.
const PART_SIZE = 2500;
const chunks = [];
for (let i = 0; i < Math.max(1, pRows.length); i += PART_SIZE) chunks.push(pRows.slice(i, i + PART_SIZE));
const sqlPart = (n, pChunk, dChunk) => `-- =====================================================================
-- MatchScent: connect the uploaded pictures to the perfumes and entries, part ${n} of ${chunks.length}   (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor, AFTER the pictures were uploaded
-- to the "${BUCKET}" storage bucket (db-migrations/2026-09-perfume-images-bucket.sql + scripts/upload-site-images.mjs)
-- and AFTER the perfumes exist (data-import/more-houses-part-N.sql).
--  * DRY RUN first (dry_run := true): it ends with a red message that lists the numbers; nothing is saved.
--  * If the numbers look right, change  dry_run := true  to  dry_run := false  and run again.
--  * All-or-nothing. It only sets the image_url column (this part: ${pChunk.length} perfumes${dChunk.length ? `, ${dChunk.length} entries` : ''});
--    it changes no other column and no other table. Before it runs, a backup of the current values is kept in
--    image_url_backup_${STAMP}_p${n} (public access off).
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_perfumes int;
  n_entries int := 0;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  EXECUTE 'CREATE TABLE image_url_backup_${STAMP}_p${n} AS
    SELECT ''perfumes''::text AS tbl, id, image_url FROM public.perfumes
    UNION ALL SELECT ''dupes''::text, id, image_url FROM public.dupes';
  EXECUTE 'ALTER TABLE image_url_backup_${STAMP}_p${n} ENABLE ROW LEVEL SECURITY';

  WITH v(b, n, u) AS (VALUES
${pChunk.join(',\n')}
  )
  UPDATE public.perfumes p SET image_url = v.u FROM v WHERE lower(p.brand) = v.b AND lower(p.name) = v.n;
  GET DIAGNOSTICS n_perfumes = ROW_COUNT;
${dChunk.length ? `
  WITH v(b, n, u) AS (VALUES
${dChunk.join(',\n')}
  )
  UPDATE public.dupes d SET image_url = v.u FROM v WHERE lower(d.brand) = v.b AND lower(d.name) = v.n;
  GET DIAGNOSTICS n_entries = ROW_COUNT;
` : ''}
  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Perfume rows that would get a picture: % (expected about ${pChunk.length}, fewer if some perfumes are not on the site yet). Entry rows: %.', n_perfumes, n_entries;
  END IF;
END $$;

SELECT (SELECT count(*) FROM public.perfumes WHERE image_url LIKE '%/${BUCKET}/%') AS perfumes_with_our_picture,
       (SELECT count(*) FROM public.dupes WHERE image_url LIKE '%/${BUCKET}/%') AS entries_with_our_picture;
`;
for (const old of fs.readdirSync('data-import').filter(x => /^site-images(-part-\d+)?\.sql$/.test(x))) fs.unlinkSync(`data-import/${old}`);
chunks.forEach((chunk, i) => fs.writeFileSync(`data-import/site-images-part-${i + 1}.sql`, sqlPart(i + 1, chunk, i === 0 ? dRows : []), 'utf8'));

const orig = Object.values(index).filter(v => v.kind === 'original').length;
console.log(`Prepared ${Object.keys(index).length} pictures (${orig} originals, ${Object.keys(index).length - orig} "inspired by").`);
console.log(`From Fragrantica: ${Object.values(index).filter(v => v.source === 'fragrantica').length}, from search results: ${Object.values(index).filter(v => v.source !== 'fragrantica').length}.`);
const total = Object.values(index).reduce((n, v) => n + v.bytes, 0);
console.log(`Total size to upload: ${(total / 1024 / 1024).toFixed(1)} MB (average ${Math.round(total / Object.keys(index).length / 1024)} KB).`);
if (problems.length) console.log('\nNotes:\n  ' + problems.join('\n  '));
console.log(`\nContact sheets: ${OUT}/sheet-N.jpg   SQL: data-import/site-images-part-N.sql`);
