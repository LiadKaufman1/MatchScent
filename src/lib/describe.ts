import { fmt, getDict, type Lang } from './i18n';
import { accordLabel, noteGroups, noteLabel } from './notes';
import type { NotePyramid } from './supabase';

// The short factual description at the top of a perfume page, built from the facts we hold (main accords, audience,
// year, perfumer, notes), e.g. "X by Y is a floral fruity fragrance for women. X was launched in 2010. The perfumer behind
// it is Z. Top notes are ...". Only facts (names, years, notes) - never a site's own descriptive text.

type Facts = {
  name: string;
  brand: string;
  gender?: string | null;
  year?: number | null;
  perfumers?: string[] | null;
  accords?: string[] | null;
  note_pyramid?: NotePyramid | null;
};

const startsHebrew = (s: string) => /^[֐-׿]/.test(s);

// "A", "A and B", "A, B and C" (Hebrew: "A ו-B" for a Latin name, "A ואחר" for a Hebrew word).
function list(items: string[], lang: Lang, and: string): string {
  if (items.length <= 1) return items[0] ?? '';
  const last = items[items.length - 1];
  const head = items.slice(0, -1).join(', ');
  if (lang !== 'he') return `${head} ${and} ${last}`;
  return `${head} ${startsHebrew(last) ? and : `${and}-`}${last}`;
}

// The two strongest accords that do not repeat each other ("white floral" already says "floral").
function family(accords: string[], lang: Lang): string {
  const chosen: string[] = [];
  for (const a of accords) {
    const words = a.toLowerCase().split(/\s+/);
    if (chosen.some(c => c.toLowerCase().split(/\s+/).some(w => words.includes(w)))) continue;
    chosen.push(a);
    if (chosen.length === 2) break;
  }
  return chosen.map(a => accordLabel(a, lang)).join(' ');
}

export function describePerfume(p: Facts, lang: Lang): string {
  const t = getDict(lang).describe;
  const audience = p.gender === 'male' ? t.forMen : p.gender === 'female' ? t.forWomen : t.forAll;
  const fam = family(p.accords ?? [], lang);
  const parts = [fmt(fam ? t.baseFamily : t.base, { name: p.name, brand: p.brand, audience, family: fam, a: /^[aeiou]/i.test(fam) ? 'an' : 'a' })];

  if (p.year) parts.push(fmt(t.year, { name: p.name, year: p.year }));

  const names = (p.perfumers ?? []).filter(Boolean);
  if (names.length) parts.push(fmt(names.length === 1 ? t.perfumerOne : t.perfumerMany, { names: list(names, lang, t.and) }));

  const groups = noteGroups(p.note_pyramid);
  if (groups.length) {
    const label = { top: t.top, heart: t.heart, base: t.baseNotes, notes: t.flat } as const;
    const sentence = groups.map(g => fmt(label[g.key], { list: list(g.notes.map(n => noteLabel(n, lang)), lang, t.and) })).join('; ');
    parts.push(`${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`);
  }
  return parts.join(' ');
}
