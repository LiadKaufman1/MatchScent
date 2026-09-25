// Offline check of src/lib/price-offers.ts against the saved shopping results (no searches used).
//   node --no-warnings scripts/test-price-offers.mjs          the offers that are kept
//   node --no-warnings scripts/test-price-offers.mjs --why    also every listing that was thrown out, with the reason
// Saved results live in data-import/serpapi-samples/ (made with scripts/price-probe.mjs). A case may list several
// files: the Israeli lookup merges the plain search and the one with the Hebrew word for perfume. Saved product pages
// (immersive-<search name>-<row>.json) are opened too, like the server does for listings sold by several stores.
import fs from 'node:fs';
import { classifyResults, expandStores, finalizeOffers } from '../src/lib/price-offers.ts';

const DIR = 'data-import/serpapi-samples';
const why = process.argv.includes('--why');
const BLOCKED = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;
const cases = [
  [['search-dior-sauvage-elixir.json'], { brand: 'Dior', name: 'Sauvage Elixir', gender: 'male' }],
  [['search-creed-aventus.json'], { brand: 'Creed', name: 'Aventus', gender: 'male' }],
  [['search-maison-francis-kurkdjian-baccarat-rouge-540.json'], { brand: 'Maison Francis Kurkdjian', name: 'Baccarat Rouge 540', gender: 'unisex' }],
  [['search-chanel-coco-mademoiselle.json'], { brand: 'Chanel', name: 'Coco Mademoiselle', gender: 'female' }],
  [['search-afnan-turathi-blue.json', 'search-afnan-turathi-blue-hebrew-variant.json'], { brand: 'Afnan', name: 'Turathi Blue', gender: null }],
];
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'));

for (const [files, wanted] of cases) {
  const present = files.filter(f => fs.existsSync(`${DIR}/${f}`));
  const raw = present.flatMap(read);
  if (!raw.length) continue;
  const dropped = [];
  const opts = { country: 'IL', isBlocked: t => BLOCKED.test(t), onDrop: (r, reason) => dropped.push([r, reason]) };
  const listed = classifyResults(raw, wanted, opts);

  // saved product pages of the first file's listings
  const base = files[0].replace(/^search-/, '').replace(/\.json$/, '');
  const first = present.length ? read(present[0]) : [];
  const expanded = [];
  for (const f of fs.readdirSync(DIR).filter(f => f.startsWith(`immersive-${base}-`))) {
    const index = Number(/-(\d+)\.json$/.exec(f)[1]);
    const parent = classifyResults([first[index]], wanted, { country: 'IL', isBlocked: opts.isBlocked })[0];
    if (parent) expanded.push(...expandStores(read(f).stores ?? [], { ...parent, rank: index }, wanted, opts));
  }

  const offers = finalizeOffers([...listed, ...expanded]);
  console.log(`\n=== ${wanted.brand} ${wanted.name}: ${raw.length} results${expanded.length ? ` + ${expanded.length} from product pages` : ''} -> ${offers.length} offers`);
  for (const o of offers) console.log(`${String(o.sizeMl ?? '?').padStart(4)}ml ${String(o.price).padStart(8)} ${o.tester ? 'TESTER ' : o.approx ? 'approx ' : '       '}${o.url ? 'URL ' : 'go  '}${o.store.slice(0, 22).padEnd(22)} ${o.title.slice(0, 60)}`);
  if (why) {
    console.log('  --- thrown out:');
    for (const [r, reason] of dropped) console.log(`  ${reason.padEnd(20)} ${String(r.extracted_price ?? '').padStart(8)} ${(r.source ?? '').slice(0, 20).padEnd(20)} ${(r.title ?? '').slice(0, 70)}`);
  }
}
