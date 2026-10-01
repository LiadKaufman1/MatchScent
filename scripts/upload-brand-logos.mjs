// Uploads the perfume-house logos collected from Fragrantica (data-import/brand-logos/<slug>.jpg) to the public
// storage bucket "brand-logos", as "<slug>.jpg" (the same slug the brand page and /brands use).
//
//   node scripts/upload-brand-logos.mjs --dry     # only list what would be uploaded
//   node scripts/upload-brand-logos.mjs           # upload everything (safe to run again: it replaces same-name files)
//
// Needs, in .env.local: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never printed).
// The bucket must exist first: db-migrations/2026-10-brand-logos-bucket.sql (run by the owner).
// It only writes files into that one bucket; it does not touch the database tables - the website finds a logo by
// its address, nothing is recorded in `brands`.

import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const BUCKET = 'brand-logos';
const DIR = 'data-import/brand-logos';

const env = {};
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function run() {
  if (!fs.existsSync(DIR)) { console.log(`Nothing to upload yet: ${DIR} does not exist.`); return; }
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.jpg'));
  console.log(`${files.length} logos to upload to the "${BUCKET}" bucket${DRY ? ' (dry run: nothing is uploaded)' : ''}.`);
  if (DRY || !files.length) return;

  const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) { console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing in .env.local'); process.exitCode = 1; return; }

  const check = await fetch(`${base}/storage/v1/bucket/${BUCKET}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!check.ok) { console.error(`The bucket "${BUCKET}" does not exist yet (HTTP ${check.status}). Run db-migrations/2026-10-brand-logos-bucket.sql first.`); process.exitCode = 1; return; }

  let ok = 0, failed = 0;
  for (const f of files) {
    const body = fs.readFileSync(path.join(DIR, f));
    const r = await fetch(`${base}/storage/v1/object/${BUCKET}/${encodeURIComponent(f)}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': 'max-age=2592000' },
      body,
    });
    if (r.ok) ok++;
    else { failed++; console.log(`  FAILED ${f}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); }
  }
  console.log(`Done. ${ok} uploaded, ${failed} failed.`);
  if (failed) process.exitCode = 2;
}

await run();
