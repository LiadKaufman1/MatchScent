// Downloads CANDIDATE bottle photos for the perfumes the site shows, into a local folder, so the
// owner can look at them and pick. It never uploads, commits or publishes anything.
//
//   node scripts/download-image-candidates.mjs --dry              # only print the searches
//   node scripts/download-image-candidates.mjs --limit 5          # first 5 perfumes (good for a test)
//   node scripts/download-image-candidates.mjs                    # all original perfumes
//   node scripts/download-image-candidates.mjs --entries          # the "inspired by" ones instead
//   node scripts/download-image-candidates.mjs --only creed-aventus
//   options: --per 3 (candidates per perfume, default 3)  --force (redo perfumes already done)
//            --free-licenses (Google Custom Search only: ask for reusable-licence images)
//
// Output (all inside the git-ignored data-import/ folder):
//   data-import/images/<slug>/1.jpg, 2.jpg, ...   the candidates
//   data-import/images/manifest.json               for every file: the image address and the page it
//                                                  came from (needed to credit or remove an image later)
//
// Search service (first one that is configured in .env.local wins):
//   SERPAPI_KEY                    SerpApi "google_images" (a free plan has a small monthly quota)
//   GOOGLE_API_KEY + GOOGLE_CSE_ID Google Custom Search JSON API, image search
// Google's own result pages are NOT scraped (that is blocked by CAPTCHAs, which we never bypass).
//
// Reminder: a picture found this way is somebody's copyright until you have checked otherwise.
// Downloading it here to look at is fine; before one goes on the site, use the manifest to check
// where it came from (brand or retailer pictures are the usual, and safest, choice).

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const has = f => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const DRY = has('--dry');
const FORCE = has('--force');
const ENTRIES = has('--entries');
const FREE_LICENSES = has('--free-licenses');
const PER = Math.min(Math.max(parseInt(val('--per', '3'), 10) || 3, 1), 8);
const LIMIT = parseInt(val('--limit', '0'), 10) || 0;
const ONLY = val('--only', '');
const OUT = 'data-import/images';
const MANIFEST = path.join(OUT, 'manifest.json');

// ---- .env.local (values are never printed) ------------------------------------------------
const env = {};
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const slugify = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- the list of perfumes the site shows ----------------------------------------------------
async function loadPerfumes() {
  const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing in .env.local');
  const get = async table => {
    const r = await fetch(`${base}/rest/v1/${table}?select=brand,name&limit=3000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Could not read ${table}: HTTP ${r.status}`);
    return r.json();
  };
  const rows = await get(ENTRIES ? 'dupes' : 'perfumes');
  const seen = new Set();
  const list = [];
  for (const r of rows) {
    const slug = slugify(`${r.brand} ${r.name}`);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    list.push({ slug, brand: r.brand, name: r.name });
  }
  return list.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---- search providers: each returns [{ url, page, title, width, height }] ------------------
const query = p => `${p.brand} ${p.name} perfume bottle`;

async function searchSerpApi(p) {
  const u = new URL('https://serpapi.com/search.json');
  u.search = new URLSearchParams({ engine: 'google_images', q: query(p), api_key: env.SERPAPI_KEY, ijn: '0' }).toString();
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const msg = j.error || `HTTP ${r.status}`;
    const err = new Error(`SerpApi: ${msg}`);
    err.quota = /run out|limit|plan|quota|exceeded/i.test(msg) || r.status === 429;
    throw err;
  }
  return (j.images_results || []).map(x => ({ url: x.original, page: x.link, title: x.title, width: x.original_width, height: x.original_height }));
}

async function searchGoogleCse(p) {
  const params = { key: env.GOOGLE_API_KEY, cx: env.GOOGLE_CSE_ID, q: query(p), searchType: 'image', num: String(Math.min(PER + 2, 10)), safe: 'active' };
  if (FREE_LICENSES) params.rights = 'cc_publicdomain|cc_attribute|cc_sharealike';
  const r = await fetch('https://www.googleapis.com/customsearch/v1?' + new URLSearchParams(params));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`Google CSE: ${j.error?.message || 'HTTP ' + r.status}`);
    err.quota = r.status === 429 || /quota|limit/i.test(j.error?.message || '');
    throw err;
  }
  return (j.items || []).map(x => ({ url: x.link, page: x.image?.contextLink, title: x.title, width: x.image?.width, height: x.image?.height }));
}

const provider = env.SERPAPI_KEY ? { name: 'SerpApi', search: searchSerpApi } : env.GOOGLE_API_KEY && env.GOOGLE_CSE_ID ? { name: 'Google CSE', search: searchGoogleCse } : null;

// ---- download one image -------------------------------------------------------------------------
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

async function download(url, destBase) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MatchScent image review)', Accept: 'image/*' } });
    if (!r.ok) return { ok: false, why: `HTTP ${r.status}` };
    const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = EXT[type];
    if (!ext) return { ok: false, why: `not a usable image (${type || 'no type'})` };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 5000) return { ok: false, why: 'too small' };
    if (buf.length > 12 * 1024 * 1024) return { ok: false, why: 'too large' };
    const file = `${destBase}.${ext}`;
    fs.writeFileSync(file, buf);
    return { ok: true, file, bytes: buf.length };
  } catch (e) {
    return { ok: false, why: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- run --------------------------------------------------------------------------------------------
// (wrapped in a function so the script can end without process.exit(), which prints a harmless
// but ugly "Assertion failed" on Windows while network connections are still closing)
async function run() {
  let perfumes = await loadPerfumes();
  if (ONLY) perfumes = perfumes.filter(p => p.slug === ONLY);
  if (LIMIT) perfumes = perfumes.slice(0, LIMIT);

  console.log(`${perfumes.length} ${ENTRIES ? '"inspired by" entries' : 'original perfumes'} to look up${DRY ? ' (dry run: nothing is searched or downloaded)' : ''}.`);
  if (DRY) {
    for (const p of perfumes) console.log(`  ${p.slug}  ->  "${query(p)}"`);
    console.log(provider ? `\nSearch service that would be used: ${provider.name}` : '\nNo search service configured yet: add SERPAPI_KEY, or GOOGLE_API_KEY + GOOGLE_CSE_ID, to .env.local.');
    return;
  }
  if (!provider) {
    console.error('No search service configured. Add SERPAPI_KEY, or GOOGLE_API_KEY + GOOGLE_CSE_ID, to .env.local (see the top of this file).');
    process.exitCode = 1;
      return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');

  let done = 0, skipped = 0, empty = 0;
  for (const p of perfumes) {
    if (!FORCE && manifest[p.slug]?.files?.length) { skipped++; continue; }
    process.stdout.write(`[${done + skipped + empty + 1}/${perfumes.length}] ${p.slug} ... `);

    let results;
    try {
      results = await provider.search(p);
    } catch (e) {
      console.log('STOPPED');
      console.error(`\n${e.message}`);
      if (e.quota) console.error('The search quota looks used up. Nothing is lost: run the same command again later and it continues where it stopped.');
      save();
      process.exitCode = 2;
        return;
    }

    const dir = path.join(OUT, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    const tried = new Set();
    for (const c of results) {
      if (files.length >= PER) break;
      if (!c.url || tried.has(c.url)) continue;
      tried.add(c.url);
      const res = await download(c.url, path.join(dir, String(files.length + 1)));
      if (res.ok) files.push({ file: path.relative(OUT, res.file).replace(/\\/g, '/'), imageUrl: c.url, pageUrl: c.page || null, title: c.title || null, width: c.width || null, height: c.height || null, bytes: res.bytes });
    }

    manifest[p.slug] = { brand: p.brand, name: p.name, query: query(p), searchedAt: new Date().toISOString(), provider: provider.name, files };
    save();
    if (files.length) { done++; console.log(`${files.length} saved`); } else { empty++; console.log('nothing usable'); }
    await sleep(1200);
  }

  console.log(`\nDone. ${done} perfumes with pictures, ${empty} with nothing usable, ${skipped} skipped (already done).`);
  console.log(`Look at the pictures in ${OUT}/<perfume>/ ; where each one came from is in ${MANIFEST}.`);
}

await run();
