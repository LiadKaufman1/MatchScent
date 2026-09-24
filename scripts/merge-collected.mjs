// Merges what the slow in-browser collection found (data-import/collected-*.json) into the local lists:
//   - Fragrantica numbers of "inspired by" fragrances -> data-import/fragrantica-image-ids.json (+ image-targets.json),
//     so `download-image-candidates.mjs --source fragrantica` can fetch their pictures
//   - note pyramids                                   -> data-import/notes-collected.json  (Fragrantica number -> notes)
//   - year / perfumers / main accords                 -> data-import/details-collected.json (Fragrantica number -> facts)
//
//   node scripts/merge-collected.mjs
//
// Local files only (data-import/ is git-ignored); nothing is uploaded or shown on the site by this script.

import fs from 'node:fs';
import { slugify } from '../src/lib/slug.ts';

const DIR = 'data-import';
const read = (f, d) => (fs.existsSync(`${DIR}/${f}`) ? JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')) : d);

const ids = read('fragrantica-image-ids.json', {});
const targets = read('fragrantica-image-targets.json', []);
const notes = read('notes-collected.json', {});
const details = read('details-collected.json', {});
const need = read('inspired-need.json', []); // { slug, brand, name } of every inspired fragrance shown on the site

// "Lattafa Perfumes" -> "Lattafa-Perfumes" (the address of the brand's page on Fragrantica)
const designerSlug = brand => brand.trim().split(/\s+/).map(w => (w === w.toUpperCase() && w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w)).join('-');

const files = fs.readdirSync(DIR).filter(f => /^collected-.*\.json$/.test(f)).sort();
let newIds = 0, newNotes = 0;
for (const file of files) {
  const { designers = {}, notes: pyramids = {}, details: facts = {} } = read(file, {});
  Object.assign(details, facts);

  for (const item of need) {
    const found = designers[designerSlug(item.brand)]?.found;
    const id = found?.[slugify(item.name)];
    if (!id) continue;
    if (!ids[item.slug]) { ids[item.slug] = id; newIds++; }
    if (!targets.some(t => t.slug === item.slug)) targets.push({ slug: item.slug, brand: item.brand, name: item.name, kind: 'inspired' });
  }

  for (const [id, page] of Object.entries(pyramids)) {
    if (page.status !== 200 || !page.groups) continue;
    if (!notes[id]) newNotes++;
    notes[id] = page.groups;
  }
}

fs.writeFileSync(`${DIR}/fragrantica-image-ids.json`, JSON.stringify(ids), 'utf8');
fs.writeFileSync(`${DIR}/fragrantica-image-targets.json`, JSON.stringify(targets), 'utf8');
fs.writeFileSync(`${DIR}/notes-collected.json`, JSON.stringify(notes), 'utf8');
fs.writeFileSync(`${DIR}/details-collected.json`, JSON.stringify(details), 'utf8');
console.log(`${files.length} file(s): ${newIds} new picture numbers (${Object.keys(ids).length} in total), ${newNotes} new note lists (${Object.keys(notes).length} in total).`);
