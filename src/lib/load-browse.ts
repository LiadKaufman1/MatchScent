import { getCatalog, entryKey, type ShownPerfume } from './load-catalog';
import { slugify } from './slug';
import type { Dupe, NotePyramid } from './supabase';
import { noteGroups } from './notes';

// "Browse" pages: everything of one brand, and every fragrance that has one note.

export type InspiredHit = { entry: Dupe; originals: ShownPerfume[] };
export type NoteHit = { perfume: ShownPerfume; group: 'top' | 'heart' | 'base' | 'notes' };

// The same "inspired by" fragrance can appear under several originals: show it once, with all of them.
function groupInspired(entries: Dupe[], byId: Map<string, ShownPerfume>): InspiredHit[] {
  const groups = new Map<string, InspiredHit>();
  for (const entry of entries) {
    const key = entryKey(entry.brand, entry.name);
    const hit = groups.get(key) ?? { entry, originals: [] };
    const original = byId.get(entry.original_perfume_id);
    if (original && !hit.originals.some(o => o.id === original.id)) hit.originals.push(original);
    groups.set(key, hit);
  }
  return [...groups.values()].sort((a, b) => a.entry.name.localeCompare(b.entry.name));
}

export async function getBrandSlugs(): Promise<string[]> {
  const { perfumes, dupes } = await getCatalog();
  return [...new Set([...perfumes.filter(p => p.entryCount > 0).map(p => p.brand), ...dupes.map(d => d.brand)].map(slugify).filter(Boolean))];
}

export async function getBrandPage(slug: string) {
  const { perfumes, dupes } = await getCatalog();
  const own = perfumes.filter(p => slugify(p.brand) === slug);
  const inspiredEntries = dupes.filter(d => slugify(d.brand) === slug);
  const brand = own[0]?.brand ?? inspiredEntries[0]?.brand;
  if (!brand) return null;
  const byId = new Map(perfumes.map(p => [p.id, p]));
  return { brand, slug, perfumes: own, inspired: groupInspired(inspiredEntries, byId) };
}

export async function getNoteSlugs(minimum = 1): Promise<string[]> {
  const { perfumes, dupes } = await getCatalog();
  const counts = new Map<string, number>();
  for (const item of [...perfumes, ...dupes]) {
    for (const g of noteGroups(item.note_pyramid)) for (const n of g.notes) {
      const slug = slugify(n);
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts].filter(([, n]) => n >= minimum).map(([slug]) => slug);
}

export async function getNotePage(slug: string) {
  const { perfumes, dupes } = await getCatalog();
  let name = '';
  const hasNote = (item: { note_pyramid?: NotePyramid | null }) => {
    for (const g of noteGroups(item.note_pyramid)) for (const n of g.notes) if (slugify(n) === slug) { name ||= n; return g.key; }
    return null;
  };
  const hits: NoteHit[] = [];
  for (const perfume of perfumes) {
    const group = hasNote(perfume);
    if (group) hits.push({ perfume, group });
  }
  const inspiredEntries = dupes.filter(d => hasNote(d));
  if (!name) return null;
  const byId = new Map(perfumes.map(p => [p.id, p]));
  return { slug, name, perfumes: hits, inspired: groupInspired(inspiredEntries, byId) };
}
