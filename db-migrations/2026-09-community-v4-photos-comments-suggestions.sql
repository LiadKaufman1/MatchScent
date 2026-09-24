-- =====================================================================
-- MatchScent: members' photos, comments on reviews, note votes, suggestions
-- (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor, AFTER
-- "2026-09-community-v3-ratings-panels.sql".
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED and lists what it WOULD create; nothing is saved.
--  * If that list looks right, change  dry_run := true  to  dry_run := false  and run again.
--  * It is all-or-nothing (a single transaction): if anything fails, nothing changes.
--
-- WHAT IT DOES
--   It only ADDS. It deletes nothing and does not change any existing row or value.
--   1. "review_comments": members reply to a review.
--   2. "note_votes": a member marks the notes they really smell in a perfume ("I smell it").
--   3. "perfume_photos": photos members upload of their own bottle. A new photo waits for
--      YOUR approval (status 'pending') and is shown on the site only after you approve it
--      in /admin/community. At most 3 photos per member per perfume.
--   4. Two storage buckets for those photos: "photo-uploads" (PRIVATE - waiting photos, nobody
--      can see them from outside) and "community-photos" (public - approved photos only).
--      Only the website's server writes to them; members never upload to storage directly.
--   5. "suggestions": a member suggests a fragrance that smells like a perfume ("similar"),
--      or a perfume that is missing from the site ("perfume"). Nothing reaches the site until
--      you approve it in /admin/community. At most 10 waiting suggestions per member.
--   6. Row Level Security on every new table: members can add / remove only THEIR OWN rows,
--      enforced by the database itself. Waiting photos and suggestions are visible only to
--      the member who sent them (and to you, through the admin page).
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('review_comments', 'note_votes', 'perfume_photos', 'suggestions')) THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Something from this migration already exists - it looks like it already ran.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfume_votes') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. Run 2026-09-community-v3-ratings-panels.sql first.';
  END IF;

  -- 1. comments on reviews ------------------------------------------------------
  CREATE TABLE public.review_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES public.reviews (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 1000),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX review_comments_review_idx ON public.review_comments (review_id);
  ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "comments are publicly readable" ON public.review_comments FOR SELECT USING (true);
  CREATE POLICY "users add their own comments" ON public.review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "users delete their own comments" ON public.review_comments FOR DELETE USING (auth.uid() = user_id);
  GRANT SELECT ON public.review_comments TO anon, authenticated;
  GRANT INSERT, DELETE ON public.review_comments TO authenticated;

  -- 2. note votes ------------------------------------------------------------------
  CREATE TABLE public.note_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 80),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (perfume_id, user_id, note)
  );
  CREATE INDEX note_votes_perfume_idx ON public.note_votes (perfume_id);
  ALTER TABLE public.note_votes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "note votes are publicly readable" ON public.note_votes FOR SELECT USING (true);
  CREATE POLICY "users add their own note votes" ON public.note_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "users delete their own note votes" ON public.note_votes FOR DELETE USING (auth.uid() = user_id);
  GRANT SELECT ON public.note_votes TO anon, authenticated;
  GRANT INSERT, DELETE ON public.note_votes TO authenticated;

  -- 3. members' photos ---------------------------------------------------------------
  CREATE TABLE public.perfume_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfume_id uuid NOT NULL REFERENCES public.perfumes (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    public_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz
  );
  CREATE INDEX perfume_photos_perfume_idx ON public.perfume_photos (perfume_id);
  ALTER TABLE public.perfume_photos ENABLE ROW LEVEL SECURITY;
  -- Everyone sees approved photos; a member also sees their own waiting ones.
  CREATE POLICY "approved photos are publicly readable" ON public.perfume_photos FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
  CREATE POLICY "users delete their own photos" ON public.perfume_photos FOR DELETE USING (auth.uid() = user_id);
  GRANT SELECT ON public.perfume_photos TO anon, authenticated;
  GRANT DELETE ON public.perfume_photos TO authenticated;
  -- No INSERT/UPDATE for members: new photos are added by the website's server (after it checked
  -- the file), and only you approve them.

  CREATE FUNCTION public.limit_photos_per_member() RETURNS trigger AS $f$
  BEGIN
    IF (SELECT count(*) FROM public.perfume_photos WHERE perfume_id = new.perfume_id AND user_id = new.user_id AND status <> 'rejected') >= 3 THEN
      RAISE EXCEPTION 'At most 3 photos per member per perfume';
    END IF;
    RETURN new;
  END;
  $f$ LANGUAGE plpgsql SET search_path = public;
  CREATE TRIGGER perfume_photos_limit BEFORE INSERT ON public.perfume_photos FOR EACH ROW EXECUTE FUNCTION public.limit_photos_per_member();

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('photo-uploads', 'photo-uploads', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp']),
         ('community-photos', 'community-photos', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp']);

  -- 4. suggestions ---------------------------------------------------------------------
  CREATE TABLE public.suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('similar', 'perfume')),
    perfume_id uuid REFERENCES public.perfumes (id) ON DELETE CASCADE,
    brand text NOT NULL CHECK (char_length(brand) BETWEEN 1 AND 80),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    gender text CHECK (gender IN ('male', 'female', 'unisex')),
    note text CHECK (note IS NULL OR char_length(note) <= 500),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    CHECK ((kind = 'similar' AND perfume_id IS NOT NULL) OR kind = 'perfume')
  );
  ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "users see their own suggestions" ON public.suggestions FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "users send suggestions" ON public.suggestions FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_at IS NULL);
  CREATE POLICY "users withdraw their own suggestions" ON public.suggestions FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
  GRANT SELECT, INSERT, DELETE ON public.suggestions TO authenticated;

  CREATE FUNCTION public.limit_pending_suggestions() RETURNS trigger AS $f$
  BEGIN
    IF (SELECT count(*) FROM public.suggestions WHERE user_id = new.user_id AND status = 'pending') >= 10 THEN
      RAISE EXCEPTION 'At most 10 waiting suggestions per member';
    END IF;
    RETURN new;
  END;
  $f$ LANGUAGE plpgsql SET search_path = public;
  CREATE TRIGGER suggestions_limit BEFORE INSERT ON public.suggestions FOR EACH ROW EXECUTE FUNCTION public.limit_pending_suggestions();

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would create: review_comments, note_votes, perfume_photos (+ max 3 per member), suggestions (+ max 10 waiting), and the storage buckets photo-uploads (private) and community-photos (public).';
  END IF;
END $$;

-- Only reached after a real run: confirms the new pieces exist.
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('review_comments', 'note_votes', 'perfume_photos', 'suggestions')) AS new_tables_expected_4,
  (SELECT count(*) FROM storage.buckets WHERE id IN ('photo-uploads', 'community-photos')) AS new_buckets_expected_2;
