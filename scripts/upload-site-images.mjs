// Uploads the prepared pictures (data-import/site-images/<slug>.jpg) to the "perfume-images" storage bucket.
//
//   node scripts/upload-site-images.mjs --dry     # only list what would be uploaded
//   node scripts/upload-site-images.mjs           # upload everything (safe to run again: it replaces same-name files)
//
// Needs, in .env.local: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never printed).
// The bucket must exist first: db-migrations/2026-09-perfume-images-bucket.sql (run by the owner).
// It only writes files into that one bucket; it does not touch the database tables.

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const BUCKET = 'perfume-images';
const DIR = 'data-import/site-images';

const env = {};
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function run() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.jpg') && !f.startsWith('sheet-')).sort();
  console.log(`${files.length} pictures to upload to the "${BUCKET}" bucket${DRY ? ' (dry run: nothing is uploaded)' : ''}.`);
  if (DRY) return;

  const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) { console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing in .env.local'); process.exitCode = 1; return; }

  // The bucket has to exist already, otherwise every upload would fail the same way.
  const check = await fetch(`${base}/storage/v1/bucket/${BUCKET}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!check.ok) { console.error(`The bucket "${BUCKET}" does not exist yet (HTTP ${check.status}). Run db-migrations/2026-09-perfume-images-bucket.sql first.`); process.exitCode = 1; return; }

  // Six uploads at a time (much faster than one by one; the picture files are small).
  let ok = 0, failed = 0, next = 0;
  const worker = async () => {
    while (next < files.length) {
      const f = files[next++];
      const body = fs.readFileSync(path.join(DIR, f));
      const r = await fetch(`${base}/storage/v1/object/${BUCKET}/${encodeURIComponent(f)}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
        body,
      });
      if (r.ok) { ok++; if (ok % 100 === 0) console.log(`  ${ok}/${files.length} ...`); }
      else { failed++; console.log(`  FAILED ${f}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`\nDone. ${ok} uploaded, ${failed} failed.`);
  if (failed) process.exitCode = 2;
}

await run();
