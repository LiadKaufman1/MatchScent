-- =====================================================================
-- MatchScent: every "inspired by" fragrance becomes a perfume with its own page   (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * All-or-nothing (a single transaction).
--
-- WHAT IT DOES
--   It only ADDS (one empty column and one new table); it deletes nothing and changes no existing value.
--   "dupes" (the "inspired by" lists) gets inspired_perfume_id: a link from each entry to the
--   perfume row of that fragrance. The perfume rows themselves are added by a second script
--   (data-import/inspired-perfumes.sql), which also fills this link.
--   After both, every fragrance has a full page (notes, ratings, reviews, shelf, photos), and the
--   page of an inspired fragrance shows which perfume(s) it is inspired by.
--   New table "brands": the list of perfume houses for the A-Z houses page (name + web address).
--   Everyone can read it; only the website's server (the owner's scripts) can add to it.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dupes' AND column_name = 'inspired_perfume_id') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The column dupes.inspired_perfume_id already exists - this migration already ran.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The table "brands" already exists - this migration already ran.';
  END IF;

  ALTER TABLE public.dupes ADD COLUMN inspired_perfume_id uuid REFERENCES public.perfumes (id) ON DELETE SET NULL;
  CREATE INDEX dupes_inspired_perfume_idx ON public.dupes (inspired_perfume_id);

  CREATE TABLE public.brands (
    slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{1,120}$'),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "brands are publicly readable" ON public.brands FOR SELECT USING (true);
  GRANT SELECT ON public.brands TO anon, authenticated;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would add the empty column dupes.inspired_perfume_id (+ an index) and the table brands (public read).';
  END IF;
END $$;

-- Only reached after a real run:
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dupes' AND column_name = 'inspired_perfume_id') AS column_expected_1,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') AS table_expected_1;
