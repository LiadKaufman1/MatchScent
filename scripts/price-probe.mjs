// Local probe (costs SerpApi searches, so every result is saved and reused offline).
//   node scripts/price-probe.mjs account                      plan + searches left (free, not a search)
//   node scripts/price-probe.mjs search "Dior Sauvage Elixir"   Google Shopping, Israel  -> serpapi-samples/search-<slug>.json
//   node scripts/price-probe.mjs immersive <slug> <index>       seller list of result #index -> serpapi-samples/immersive-<slug>-<index>.json
// Never prints the key or any URL that contains it.
import fs from 'node:fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const key = env.SERPAPI_KEY;
if (!key) throw new Error('SERPAPI_KEY is missing in .env.local');

const DIR = 'data-import/serpapi-samples';
fs.mkdirSync(DIR, { recursive: true });
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
const host = x => { try { const y = new URL(x); return y.hostname + y.pathname.slice(0, 60); } catch { return String(x).slice(0, 60); } };
const [, , mode = 'account', arg1, arg2] = process.argv;

if (mode === 'account') {
  const r = await fetch(`https://serpapi.com/account?api_key=${encodeURIComponent(key)}`);
  const a = await r.json();
  console.log(JSON.stringify({ status: r.status, plan: a.plan_name, per_month: a.searches_per_month, left: a.total_searches_left, used_this_month: a.this_month_usage }));
} else if (mode === 'search') {
  const q = arg1;
  if (!q) throw new Error('give a query');
  const params = new URLSearchParams({ engine: 'google_shopping', q, gl: 'il', hl: 'iw', google_domain: 'google.co.il', api_key: key });
  const t0 = Date.now();
  const r = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await r.json();
  console.log('HTTP', r.status, 'in', Date.now() - t0, 'ms');
  if (data.error) console.log('error:', data.error);
  const list = data.shopping_results ?? [];
  fs.writeFileSync(`${DIR}/search-${slug(q)}.json`, JSON.stringify(list, null, 1));
  console.log('saved', list.length, 'results');
} else if (mode === 'immersive') {
  const list = JSON.parse(fs.readFileSync(`${DIR}/search-${arg1}.json`, 'utf8'));
  const pick = list[Number(arg2 ?? 0)];
  console.log('picked:', pick.title, '|', pick.source, pick.price, '| multiple_sources:', !!pick.multiple_sources);
  const u = new URL(pick.serpapi_immersive_product_api);
  u.searchParams.set('api_key', key);
  const t0 = Date.now();
  const r = await fetch(u);
  const data = await r.json();
  console.log('HTTP', r.status, 'in', Date.now() - t0, 'ms');
  if (data.error) console.log('error:', data.error);
  const pr = data.product_results ?? {};
  console.log('title:', pr.title, '| brand:', pr.brand, '| stores:', (pr.stores ?? []).length);
  for (const s of pr.stores ?? []) console.log(JSON.stringify({ name: s.name, price: s.price, num: s.extracted_price, total: s.extracted_total, link: host(s.link), title: (s.title || '').slice(0, 60), fields: Object.keys(s).join(',') }));
  fs.writeFileSync(`${DIR}/immersive-${arg1}-${arg2 ?? 0}.json`, JSON.stringify(pr, null, 1));
} else {
  throw new Error('unknown mode ' + mode);
}
