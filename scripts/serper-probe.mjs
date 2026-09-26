// Local probe of Serper.dev (a cheaper Google search API) - costs 1 credit per search, so results are saved and reused offline.
//   node scripts/serper-probe.mjs account                        credits left (free)
//   node scripts/serper-probe.mjs shopping "Emporio Armani Stronger With You"   Google Shopping, Israel -> serpapi-samples/serper-<slug>.json
// Needs SERPER_API_KEY in .env.local (never printed).
import fs from 'node:fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const key = env.SERPER_API_KEY;
if (!key) throw new Error('SERPER_API_KEY is missing in .env.local');

const DIR = 'data-import/serpapi-samples';
fs.mkdirSync(DIR, { recursive: true });
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
const [, , mode = 'account', arg1] = process.argv;
const headers = { 'X-API-KEY': key, 'Content-Type': 'application/json' };

if (mode === 'account') {
  const r = await fetch('https://google.serper.dev/account', { headers });
  console.log('HTTP', r.status, (await r.text()).replace(key, '***').slice(0, 300));
} else if (mode === 'shopping') {
  if (!arg1) throw new Error('give a query');
  const t0 = Date.now();
  const r = await fetch('https://google.serper.dev/shopping', { method: 'POST', headers, body: JSON.stringify({ q: arg1, gl: 'il', hl: 'iw', num: 40 }) });
  const data = await r.json();
  console.log('HTTP', r.status, 'in', Date.now() - t0, 'ms', data.message ?? '');
  const list = data.shopping ?? [];
  fs.writeFileSync(`${DIR}/serper-${slug(arg1)}.json`, JSON.stringify(data, null, 1));
  console.log('saved', list.length, 'results; fields of the first:', Object.keys(list[0] ?? {}).join(','));
  for (const x of list) console.log(String(x.source ?? '').slice(0, 22).padEnd(22), String(x.price ?? '').padStart(10), (x.title ?? '').slice(0, 70));
} else {
  throw new Error('unknown mode ' + mode);
}
