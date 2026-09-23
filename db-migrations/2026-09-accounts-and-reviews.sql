-- =====================================================================
-- MatchScent: user accounts, star ratings and written reviews   (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED and lists what it WOULD create; nothing is saved.
--  * If that list looks right, change  dry_run := true  to  dry_run := false  and run again.
--  * It is all-or-nothing (a single transaction): if anything fails, nothing changes.
--
-- WHAT IT DOES
--   Only ADDS things. It never touches perfumes, dupes, or any existing table/column/row.
--   1. Creates "profiles" - one row per registered visitor (their display name).
--      A trigger fills it in automatically the moment someone signs up.
--   2. Creates "ratings" - one 1-5 star score per visitor per perfume.
--   3. Creates "reviews" - one written review per visitor per perfume.
--   4. Turns on Row Level Security on all three: everyone can READ them (so ratings
--      and reviews show up for every visitor, logged in or not), but a visitor can only
--      ever add/change/delete THEIR OWN row - enforced by the database itself, not by
--      the website's code.
--
-- Prerequisite (do this in the Supabase dashboard, not here): Authentication -> URL
-- Configuration -> set the Site URL to the live site address, and decide there whether
-- new accounts must confirm their email before they can log in.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Table "profiles" already exists - this migration looks like it already ran.';
  END IF;

  -- 1. profiles ---------------------------------------------------------
  CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
  CREATE POLICY "users edit their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  GRANT SELECT ON public.profiles TO anon, authenticated;
  GRANT UPDATE ON public.profiles TO authenticated;

  -- Fills "profiles" automatically when someone signs up (runs with elevated rights,
  -- so it can insert even though ordinary visitors cannot insert into profiles directly).
  CREATE FUNCTION public.handle_new_user() RETURNS trigger AS $f$
  BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
    RETURN new;
  END;
  $f$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- 2. ratings ------------------------------------------------------------
  -- user_id points at "profiles", not "auth.users" directly, purely so the website can
  -- ask "give me this review plus its author's name" in one request.
  CREATE TABLE public.ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (perfume_id, user_id)
  );
  ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ratings are publicly readable" ON public.ratings FOR SELECT USING (true);
  CREATE POLICY "users manage their own ratings" ON public.ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.ratings TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;

  -- 3. reviews ------------------------------------------------------------
  CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (perfume_id, user_id)
  );
  ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
  CREATE POLICY "users manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  GRANT SELECT ON public.reviews TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would create: profiles, ratings, reviews (each with Row Level Security: public read, owner-only write) and a trigger that fills "profiles" automatically on signup.';
  END IF;
END $$;

-- Only reached after a real run: confirms the three tables now exist.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('profiles', 'ratings', 'reviews')
ORDER BY table_name;
