import { cache } from 'react';
import { getCatalog, type ShownPerfume } from './load-catalog';
import { noteGroups } from './notes';
import { slugify } from './slug';

// "All notes": every note on the site, and picking one or more shows the fragrances that have ALL of them (not just
// any of them) - a note pyramid is specific enough that "has vanilla and has oud" is what visitors actually want.

export type NoteOption = { slug: string; name: string; count: number };

const buildIndex = cache(async () => {
  const { perfumes } = await getCatalog();
  const bySlug = new Map<string, NoteOption>();
  const notesOf = new Map<string, Set<string>>(); // perfume id -> its note slugs
  for (const p of perfumes) {
    const slugs = new Set<string>();
    for (const g of noteGroups(p.note_pyramid)) {
      for (const n of g.notes) {
        const slug = slugify(n);
        if (!slug || slugs.has(slug)) continue; // a note repeated in top+heart on the same perfume counts once
        slugs.add(slug);
        const entry = bySlug.get(slug) ?? { slug, name: n, count: 0 };
        entry.count++;
        bySlug.set(slug, entry);
      }
    }
    notesOf.set(p.id, slugs);
  }
  return { perfumes, bySlug, notesOf };
});

export async function listNoteOptions(): Promise<NoteOption[]> {
  const { bySlug } = await buildIndex();
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function perfumesWithAllNotes(slugs: string[]): Promise<ShownPerfume[]> {
  if (!slugs.length) return [];
  const { perfumes, notesOf } = await buildIndex();
  return perfumes
    .filter(p => slugs.every(s => notesOf.get(p.id)?.has(s)))
    .sort((a, b) => Number(b.entryCount > 0) - Number(a.entryCount > 0) || `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
}
