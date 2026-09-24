// Shared by server and browser code (kept free of imports so client components can use it).
export const ASPECTS = ['scent', 'longevity', 'sillage', 'bottle', 'value'] as const;
export type Aspect = (typeof ASPECTS)[number];

export type ReviewWithAuthor = { id: string; body: string; created_at: string; author: string; user_id: string };
export type EntryVoteCounts = { up: number; down: number };
export type PerfumeCommunity = {
  average: number;
  count: number;
  aspects: Record<Aspect, { average: number; count: number } | null>;
  reviews: ReviewWithAuthor[];
  entryVotes: Record<string, EntryVoteCounts>; // key = entryKey(brand, name)
  shelf: { own: number; had: number; want: number };
};
