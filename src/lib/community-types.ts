// Shared by server and browser code (kept free of imports so client components can use it).

// Optional extra stars of a rating (Parfumo style). The other three columns of "ratings"
// (longevity, sillage, value) are not used any more: those questions are asked as
// the Fragrantica-style choices below.
export const ASPECTS = ['scent', 'bottle'] as const;
export type Aspect = (typeof ASPECTS)[number];

// One-choice questions (a visitor picks one answer) and "when to wear" (a visitor may pick several).
export const CHOICE_KINDS = ['longevity', 'sillage', 'gender', 'value'] as const;
export type ChoiceKind = (typeof CHOICE_KINDS)[number];
export const CHOICE_SIZES: Record<ChoiceKind, number> = { longevity: 5, sillage: 4, gender: 5, value: 5 };

export const WEAR_KEYS = ['winter', 'spring', 'summer', 'fall', 'day', 'night'] as const;
export type WearKey = (typeof WEAR_KEYS)[number];
export type VoteKind = ChoiceKind | `wear_${WearKey}`;

export const isVoteKind = (kind: string): kind is VoteKind =>
  (CHOICE_KINDS as readonly string[]).includes(kind) || WEAR_KEYS.some(k => `wear_${k}` === kind);

// kind -> answer number -> how many visitors chose it
export type VoteCounts = Partial<Record<VoteKind, Record<number, number>>>;

export type CommentRow = { id: string; body: string; created_at: string; author: string; user_id: string };
export type ReviewWithAuthor = { id: string; body: string; created_at: string; author: string; user_id: string; helpful: number; comments: CommentRow[]; score?: number | null };
export type PhotoRow = { id: string; url: string; author: string; user_id: string; created_at: string };
export type PointRow = { id: string; kind: 'pro' | 'con'; body: string; user_id: string; up: number; down: number };
export type EntryVoteCounts = { up: number; down: number };
export type PerfumeCommunity = {
  average: number;                       // love/like/ok/dislike/hate -> 5..1
  count: number;
  ratingCounts: Record<number, number>;  // score 1..5 -> visitors
  aspects: Record<Aspect, { average: number; count: number } | null>;
  votes: VoteCounts;
  points: PointRow[];
  reviews: ReviewWithAuthor[];
  entryVotes: Record<string, EntryVoteCounts>; // key = entryKey(brand, name)
  shelf: { own: number; had: number; want: number };
  noteVotes: Record<string, number>;     // note name (lower case) -> members who smell it
  photos: PhotoRow[];                    // approved members' photos
};
