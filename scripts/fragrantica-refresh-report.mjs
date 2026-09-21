// Monthly "what are we missing?" report. Reads only local files and writes a readable report.
//
//   node scripts/fragrantica-refresh-report.mjs
//
// Input  data-import/refresh-scraped.json   for every NEW fragrance (year >= current-1, popular), the
//                                            "This perfume reminds me of" list read from its Fragrantica page
//                                            (slug -> [[brand, name, likes, dislikes], ...])
//        data-import/catalog-snapshot.json  { originals: [{brand,name}], inspired: [{brand,name}] } taken from the site's database
// Output data-import/refresh-report.txt
//
// A new fragrance X that "reminds me of" an original O tells us two things:
//   1. O is in our catalog  -> X is a candidate "inspired by" entry for O (unless it is already listed)
//   2. O is NOT in our catalog -> O is a candidate for a NEW original perfume on the site
// The report only proposes. Nothing changes on the site until the owner approves and runs the SQL.

import fs from 'node:fs';
import { MIN_VOTES, isExcludedBrand, isInspiredSideHouse, nameWithoutHouse, norm, parseCount, sameBrand } from './lib/rules.mjs';

const scraped = JSON.parse(fs.readFileSync('data-import/refresh-scraped.json', 'utf8'));
const { originals, inspired } = JSON.parse(fs.readFileSync('data-import/catalog-snapshot.json', 'utf8'));

// "Lattafa-Perfumes/Asad-Bourbon-101124" -> { brand: "Lattafa Perfumes", name: "Asad Bourbon" }
const fromSlug = slug => {
  const [b, f] = slug.split('/');
  return { brand: b.replace(/-/g, ' '), name: f.replace(/-\d+$/, '').replace(/-/g, ' ') };
};

// Houses that mostly sell the "inspired" side: they are not proposed as new originals.
const brandCount = {};
for (const e of inspired) brandCount[norm(e.brand)] = (brandCount[norm(e.brand)] || 0) + 1;
const inspiredSideHouse = brand => isInspiredSideHouse(brand) || Object.entries(brandCount).some(([b, n]) => n >= 5 && sameBrand(b, brand));

const findOriginal = (brand, name) => originals.find(o => sameBrand(o.brand, brand) && (norm(o.name) === norm(name) || nameWithoutHouse(brand, name) === nameWithoutHouse(o.brand, o.name)));
// a version of a perfume we already have ("Angels' Share Paradis" for "Angels' Share") is not a new original
const isVersionOfOriginal = (brand, name) => originals.some(o => sameBrand(o.brand, brand) && (' ' + nameWithoutHouse(brand, name)).startsWith(' ' + nameWithoutHouse(o.brand, o.name) + ' '));
const alreadyListed = (o, x) => inspired.some(e => sameBrand(e.brand, x.brand) && norm(e.name) === norm(x.name)); // coarse: listed anywhere on the site

const additions = []; // new inspired entries for perfumes we already have
const newOriginals = new Map(); // original not in catalog -> aggregated votes

for (const [slug, items] of Object.entries(scraped)) {
  const x = fromSlug(slug);
  for (const [brand, name, l, d] of items) {
    const likes = parseCount(l), dislikes = parseCount(d);
    if (likes === null || dislikes === null) continue;
    const diff = likes - dislikes;
    if (diff <= 0 || likes + dislikes < MIN_VOTES) continue;
    if (sameBrand(brand, x.brand) || isExcludedBrand(brand)) continue;
    const o = findOriginal(brand, name);
    if (o) {
      additions.push({ original: `${o.brand} | ${o.name}`, inspired: `${x.brand} | ${x.name}`, diff, listed: alreadyListed(o, x) });
    } else if (!inspiredSideHouse(brand) && !isVersionOfOriginal(brand, name)) {
      const key = `${brand} | ${name}`;
      const cur = newOriginals.get(key) || { key, diff: 0, mentions: [] };
      cur.diff = Math.max(cur.diff, diff); // the strongest single signal, not a sum
      cur.mentions.push(`${x.name} (${diff})`);
      newOriginals.set(key, cur);
    }
  }
}

let out = `Fragrantica refresh report (${new Date().toISOString().slice(0, 10)})\n`;
out += `Read ${Object.keys(scraped).length} new fragrances. Catalog: ${originals.length} originals, ${inspired.length} inspired entries.\n`;

out += `\n== 1. New "inspired by" candidates for perfumes we already have (${additions.filter(a => !a.listed).length} new, ${additions.filter(a => a.listed).length} already on the site)\n`;
for (const a of additions.sort((p, q) => q.diff - p.diff)) out += `  ${a.listed ? '[already listed] ' : '[NEW]            '}${a.original}  <-  ${a.inspired}   (votes ${a.diff})\n`;

// versions of one fragrance ("The Most Wanted" / "The Most Wanted Parfum") are shown once, under the shortest name
const list = [...newOriginals.values()].sort((p, q) => p.key.length - q.key.length);
const merged = [];
for (const r of list) {
  const [b, n] = r.key.split(' | ');
  const base = merged.find(m => { const [mb, mn] = m.key.split(' | '); return sameBrand(mb, b) && (' ' + norm(n)).startsWith(' ' + norm(mn) + ' '); });
  if (base) { base.diff = Math.max(base.diff, r.diff); base.mentions.push(...r.mentions); base.versions = (base.versions || 0) + 1; } else merged.push(r);
}
const ranked = merged.sort((p, q) => q.diff - p.diff);
out += `\n== 2. Popular originals that are NOT on the site yet (${ranked.length}), strongest first\n`;
for (const r of ranked) out += `  ${String(r.diff).padStart(5)}  ${r.key}   <- ${r.mentions.join(', ')}\n`;

fs.writeFileSync('data-import/refresh-report.txt', out, 'utf8');
console.log(out);
