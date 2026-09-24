-- =====================================================================
-- MatchScent: Fragrantica-style user ratings panels, pros/cons, helpful votes, perfume facts
-- (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED and lists what it WOULD create; nothing is saved.
--  * If that list looks right, change  dry_run := true  to  dry_run := false  and run again.
--  * It is all-or-nothing (a single transaction): if anything fails, nothing changes.
--
-- WHAT IT DOES
--   It only ADDS. It deletes nothing and does not change any existing row or value.
--   1. New table "perfume_votes": one vote per visitor per question on a perfume -
--      longevity, sillage, gender, price value, and "when to wear" (winter / spring / summer /
--      fall / day / night, several can be chosen). The love / like / ok / dislike / hate rating
--      keeps living in the existing "ratings" table (5 = love ... 1 = hate).
--   2. New table "perfume_points": a short pro or con written by a visitor
--      ("Long lasting", "Expensive"), and "point_votes": thumbs up / down on such a point.
--   3. New table "review_votes": "this review was helpful".
--   4. "perfumes" gets three new empty columns: year, perfumers, accords (facts about the
--      fragrance; filled by a separate script afterwards).
--   5. "profiles" gets one new empty column, bio (a short text about the member, at most 300 characters).
--   6. Row Level Security on all new tables: everyone can READ (so counts show for every
--      visitor), a visitor can only add/change/delete THEIR OWN rows - enforced by the
--      database itself, not by the website's code.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('perfume_votes', 'perfume_points', 'point_votes', 'review_votes'))
     OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'perfumes' AND column_name IN ('year', 'perfumers', 'accords'))
     OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Something from this migration already exists - it looks like it already ran.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The table "reviews" is missing - run the accounts migration first.';
  END IF;

  -- 1. perfume_votes --------------------------------------------------------
  CREATE TABLE public.perfume_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    kind text NOT NULL,
    value smallint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (perfume_id, user_id, kind),
    CONSTRAINT perfume_votes_kind_value CHECK (
      (kind = 'sillage' AND value BETWEEN 1 AND 4)
      OR (kind IN ('longevity', 'gender', 'value') AND value BETWEEN 1 AND 5)
      OR (kind IN ('wear_winter', 'wear_spring', 'wear_summer', 'wear_fall', 'wear_day', 'wear_night') AND value = 1)
    )
  );
  CREATE INDEX perfume_votes_perfume_idx ON public.perfume_votes (perfume_id);
  ALTER TABLE public.perfume_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "perfume votes are publicly readable" ON public.perfume_votes FOR SELECT USING (true);
  CREATE POLICY "users manage their own perfume votes" ON public.perfume_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.perfume_votes TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.perfume_votes TO authenticated;

  -- 2. pros / cons ------------------------------------------------------------
  CREATE TABLE public.perfume_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('pro', 'con')),
    body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 140),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX perfume_points_perfume_idx ON public.perfume_points (perfume_id);
  ALTER TABLE public.perfume_points ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "points are publicly readable" ON public.perfume_points FOR SELECT USING (true);
  CREATE POLICY "users manage their own points" ON public.perfume_points FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.perfume_points TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.perfume_points TO authenticated;

  CREATE TABLE public.point_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    point_id uuid NOT NULL REFERENCES public.perfume_points (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    vote smallint NOT NULL CHECK (vote IN (-1, 1)),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (point_id, user_id)
  );
  CREATE INDEX point_votes_point_idx ON public.point_votes (point_id);
  ALTER TABLE public.point_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "point votes are publicly readable" ON public.point_votes FOR SELECT USING (true);
  CREATE POLICY "users manage their own point votes" ON public.point_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.point_votes TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.point_votes TO authenticated;

  -- 3. helpful votes on reviews ---------------------------------------------------
  CREATE TABLE public.review_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES public.reviews (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (review_id, user_id)
  );
  CREATE INDEX review_votes_review_idx ON public.review_votes (review_id);
  ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "review votes are publicly readable" ON public.review_votes FOR SELECT USING (true);
  CREATE POLICY "users manage their own review votes" ON public.review_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.review_votes TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.review_votes TO authenticated;

  -- 4. facts about a perfume ------------------------------------------------------
  ALTER TABLE public.perfumes
    ADD COLUMN year smallint,
    ADD COLUMN perfumers text[],
    ADD COLUMN accords text[];

  -- 5. a short text about the member (they edit it on their own profile page) ------
  ALTER TABLE public.profiles ADD COLUMN bio text CHECK (bio IS NULL OR char_length(bio) <= 300);

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would create: perfume_votes, perfume_points, point_votes, review_votes (public read, owner-only write) and add the columns year, perfumers, accords to perfumes and bio to profiles.';
  END IF;
END $$;

-- Only reached after a real run: confirms the new pieces exist.
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('perfume_votes', 'perfume_points', 'point_votes', 'review_votes')) AS new_tables_expected_4,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name = 'perfumes' AND column_name IN ('year', 'perfumers', 'accords')) OR (table_name = 'profiles' AND column_name = 'bio'))) AS new_columns_expected_4;
