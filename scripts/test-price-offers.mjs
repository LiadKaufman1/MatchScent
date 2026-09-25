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
  [['search-giorgio-armani-stronger-with-you.json'], { brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male', variantWords: ['intensely'] }],
  [['search-giorgio-armani-acqua-di-gio-profumo.json'], { brand: 'Giorgio Armani', name: 'Acqua di Giò Profumo', gender: 'male' }],
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

// Titles made up to check single rules (nothing is fetched): [wanted, title, should it be kept?]
const synthetic = [
  [{ brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male' }, 'Giorgio Armani Stronger With You פרפיום לגבר', false],
  [{ brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male' }, 'ACE | Giorgio Armani Stronger With You EDT 100ML ארמני', true],
  [{ brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male' }, 'בושם לגבר 100 מל Emporio Armani Stronger With You Powerfully או דה פרפיום', false],
  [{ brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male' }, 'Armani Stronger With You Oud א.ד.פ לגבר', false],
  [{ brand: 'Giorgio Armani', name: 'Stronger With You', gender: 'male' }, 'בושם לגבר 100 מל emporio armani stronger with you או דה טואלט', true],
  [{ brand: 'Dior', name: 'Sauvage Elixir', gender: 'male' }, 'Christian Dior Sauvage Elixir PARFUM | Loven Mour', true, 'Loven Mour'],
  [{ brand: 'Dior', name: 'Sauvage', gender: 'male' }, 'Dior Sauvage Parfum 100ml', false],
  [{ brand: 'Dior', name: 'Sauvage', gender: 'male' }, 'Dior Sauvage Eau de Parfum 100ml', true],
  [{ brand: 'Creed', name: 'Aventus', gender: 'male' }, 'Creed Aventus 100ml EDP Sealed', true],
];
console.log('\n=== single rules');
for (const [wanted, title, keep, source] of synthetic) {
  const got = classifyResults([{ title, source: source ?? 'ACE', price: '₪250.00', extracted_price: 250 }], wanted, { country: 'IL', isBlocked: t => BLOCKED.test(t) }).length > 0;
  console.log(`${got === keep ? 'ok  ' : 'FAIL'} ${keep ? 'keep' : 'drop'}  ${wanted.name}: ${title}`);
}
