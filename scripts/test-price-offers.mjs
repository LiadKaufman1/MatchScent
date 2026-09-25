// Offline check of src/lib/price-offers.ts against the saved shopping results (no credits used).
//   node --no-warnings scripts/test-price-offers.mjs
import fs from 'node:fs';
import { cleanOffers } from '../src/lib/price-offers.ts';

const BLOCKED = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;
const cases = [
  ['search-dior-sauvage-elixir.json', { brand: 'Dior', name: 'Sauvage Elixir', gender: 'male' }],
  ['search-creed-aventus.json', { brand: 'Creed', name: 'Aventus', gender: 'male' }],
  ['search-maison-francis-kurkdjian-baccarat-rouge-540.json', { brand: 'Maison Francis Kurkdjian', name: 'Baccarat Rouge 540', gender: 'unisex' }],
  ['search-chanel-coco-mademoiselle.json', { brand: 'Chanel', name: 'Coco Mademoiselle', gender: 'female' }],
];
for (const [file, wanted] of cases) {
  const raw = JSON.parse(fs.readFileSync(`data-import/serpapi-samples/${file}`, 'utf8'));
  const offers = cleanOffers(raw, wanted, { country: 'IL', isBlocked: t => BLOCKED.test(t) });
  console.log(`\n=== ${wanted.brand} ${wanted.name}: ${raw.length} results -> ${offers.length} offers`);
  for (const o of offers) console.log(`${o.local ? 'IL ' : '-- '}${String(o.sizeMl ?? '?').padStart(4)}ml ${String(o.price).padStart(8)} ${o.tester ? 'TESTER ' : '       '}${o.store.slice(0, 22).padEnd(22)} ${o.title.slice(0, 70)}`);
}
