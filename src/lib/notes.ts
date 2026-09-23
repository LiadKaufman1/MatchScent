import type { NotePyramid } from './supabase';
import type { Lang } from './i18n';
import { NOTES_HE, NOTE_ADJECTIVES_HE } from './notes-he';

// Note names are stored in English; Hebrew visitors see the Hebrew name from NOTES_HE
// (a note that is not in that list yet is shown in English rather than left out).
export function noteLabel(name: string, lang: Lang): string {
  if (lang !== 'he') return name;
  const key = name.trim().toLowerCase();
  const exact = NOTES_HE[key];
  if (exact) return exact;

  // "Moroccan Jasmine" -> "יסמין מרוקאי": peel off a leading place/variety word.
  const words = key.split(/\s+/);
  for (let take = Math.min(2, words.length - 1); take >= 1; take--) {
    const adjective = NOTE_ADJECTIVES_HE[words.slice(0, take).join(' ')];
    const rest = NOTES_HE[words.slice(take).join(' ')];
    if (adjective && rest) return `${rest} ${adjective}`;
  }
  return name;
}

export type NoteGroup = { key: 'top' | 'heart' | 'base' | 'notes'; notes: string[] };

// The groups that actually have notes, in the order top -> heart -> base.
export function noteGroups(p: NotePyramid | null | undefined): NoteGroup[] {
  if (!p) return [];
  return (['top', 'heart', 'base', 'notes'] as const)
    .map(key => ({ key, notes: (p[key] ?? []).filter(Boolean) }))
    .filter(g => g.notes.length > 0);
}
