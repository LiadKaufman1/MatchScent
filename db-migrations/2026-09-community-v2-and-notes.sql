-- =====================================================================
-- MatchScent: fragrance notes + detailed ratings + votes on "inspired by" + collections
-- (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED and lists what it WOULD change; nothing is saved.
--  * If that list looks right, change  dry_run := true  to  dry_run := false  and run again.
--  * It is all-or-nothing (a single transaction): if anything fails, nothing changes.
--
-- WHAT IT DOES
--   It only ADDS. It deletes nothing and does not change any existing row or value.
--   1. "perfumes" and "dupes" each get ONE new empty column, note_pyramid (top / heart /
--      base notes). The notes themselves are loaded by a separate script afterwards.
--   2. "ratings" gets five new OPTIONAL columns (scent, longevity, sillage, bottle, value,
--      each 1-5). The existing overall score stays exactly as it is.
--   3. New table "entry_votes": a visitor says whether an "inspired by" fragrance really
--      smells like the original (+1 yes / -1 no). It is tied to the perfume and to the
--      fragrance's name (not to the row id), so a later re-import of the lists never
--      wipes the visitors' votes.
--   4. New table "collections": a visitor marks a perfume as "I own it", "I had it" or
--      "I want it" (their shelf, shown on their profile page).
--   5. Row Level Security on both new tables: everyone can READ (counts and profile pages
--      work for every visitor), but a visitor can only ever add/change/delete THEIR OWN
--      row - enforced by the database itself, not by the website's code.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('entry_votes', 'collections'))
     OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'perfumes' AND column_name = 'note_pyramid') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Something from this migration already exists (entry_votes / collections / note_pyramid) - it looks like it already ran.';
  END IF;

  -- 1. notes -------------------------------------------------------------
  -- Shape: {"top": ["Bergamot", ...], "heart": [...], "base": [...]}   (English names; the
  -- website translates them to Hebrew when it shows them). A fragrance that has no
  -- top/heart/base split uses {"notes": [...]} instead.
  ALTER TABLE public.perfumes ADD COLUMN note_pyramid jsonb;
  ALTER TABLE public.dupes ADD COLUMN note_pyramid jsonb;

  -- 2. detailed ratings ---------------------------------------------------
  ALTER TABLE public.ratings
    ADD COLUMN scent smallint CHECK (scent BETWEEN 1 AND 5),
    ADD COLUMN longevity smallint CHECK (longevity BETWEEN 1 AND 5),
    ADD COLUMN sillage smallint CHECK (sillage BETWEEN 1 AND 5),
    ADD COLUMN bottle smallint CHECK (bottle BETWEEN 1 AND 5),
    ADD COLUMN value smallint CHECK (value BETWEEN 1 AND 5);

  -- 3. votes on "inspired by" entries -----------------------------------------
  -- entry_key = the fragrance's brand + name as a lower-case slug, e.g. "lattafa-perfumes-asad".
  CREATE TABLE public.entry_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    entry_key text NOT NULL CHECK (char_length(entry_key) BETWEEN 1 AND 200),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    vote smallint NOT NULL CHECK (vote IN (-1, 1)),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (perfume_id, entry_key, user_id)
  );
  CREATE INDEX entry_votes_perfume_idx ON public.entry_votes (perfume_id);
  ALTER TABLE public.entry_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "entry votes are publicly readable" ON public.entry_votes FOR SELECT USING (true);
  CREATE POLICY "users manage their own entry votes" ON public.entry_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.entry_votes TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.entry_votes TO authenticated;

  -- 4. collections ------------------------------------------------------------
  CREATE TABLE public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('own', 'had', 'want')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, perfume_id)
  );
  CREATE INDEX collections_perfume_idx ON public.collections (perfume_id);
  ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "collections are publicly readable" ON public.collections FOR SELECT USING (true);
  CREATE POLICY "users manage their own collection" ON public.collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.collections TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.collections TO authenticated;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would add: column note_pyramid on perfumes and dupes; 5 optional rating columns on ratings; new tables entry_votes and collections (public read, owner-only write).';
  END IF;
END $$;

-- Only reached after a real run: confirms the new pieces exist.
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'note_pyramid') AS note_columns_expected_2,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name IN ('scent', 'longevity', 'sillage', 'bottle', 'value')) AS rating_columns_expected_5,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('entry_votes', 'collections')) AS new_tables_expected_2;
