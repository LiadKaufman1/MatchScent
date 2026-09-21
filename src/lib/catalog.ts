import type { Perfume, Dupe } from './supabase';

// Temporary safety net for the public site. It does NOT delete anything from the
// database; it only decides what visitors are shown.

// Image hosts that next/image is allowed to load. Keep in sync with next.config.mjs.
const ALLOWED_IMAGE_HOSTS = new Set(['images.unsplash.com']);

// Words we never show visitors (the old data contains raw store product titles).
const BLOCKED_WORDS = /\b(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\b/i;

const isImageLoadable = (url: string | null | undefined) => {
  try {
    const u = new URL(url ?? '');
    return u.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
};

const keyOf = (brand: string, name: string) =>
  `${brand}|${name}`.toLowerCase().replace(/\s+/g, ' ').trim();

export const isShowable = (d: Dupe) =>
  !BLOCKED_WORDS.test(`${d.name} ${d.brand} ${d.notes ?? ''}`) && isImageLoadable(d.image_url);

// - hides similar-scent entries with blocked wording or an image that cannot load
// - shows a perfume that exists twice (same brand + name) only once, merging its entries
export function prepareCatalog(perfumes: Perfume[], dupes: Dupe[]) {
  const showable = dupes.filter(isShowable);

  const countById = new Map<string, number>();
  for (const d of showable) {
    countById.set(d.original_perfume_id, (countById.get(d.original_perfume_id) ?? 0) + 1);
  }
  const count = (p: Perfume) => countById.get(p.id) ?? 0;

  const groups = new Map<string, Perfume[]>();
  for (const p of perfumes) {
    const k = keyOf(p.brand, p.name);
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  const shownPerfumes: Perfume[] = [];
  const canonicalId = new Map<string, string>();
  for (const group of groups.values()) {
    const best = group.reduce((a, b) => (count(b) > count(a) ? b : a));
    shownPerfumes.push(best);
    for (const p of group) canonicalId.set(p.id, best.id);
  }

  const merged = new Map<string, Dupe>();
  for (const d of showable) {
    const perfumeId = canonicalId.get(d.original_perfume_id);
    if (!perfumeId) continue;
    const k = `${perfumeId}|${keyOf(d.brand, d.name)}`;
    const existing = merged.get(k);
    if (!existing || d.similarity_score > existing.similarity_score) {
      merged.set(k, { ...d, original_perfume_id: perfumeId });
    }
  }

  return { perfumes: shownPerfumes, dupes: [...merged.values()] };
}
