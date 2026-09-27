-- =====================================================================
-- MatchScent: remove every "The Dua Brand" perfume (owner asked, 2026-09-27)          (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Read the numbers, then change to  dry_run := false  and run again.
--  * All-or-nothing (a single transaction). Backups of everything it removes are kept in
--    perfumes_backup_dua_2026_09_27 and dupes_backup_dua_2026_09_27 (public access off), so this can be undone.
--
-- WHAT IT DOES
--   Deletes every row whose brand is "The Dua Brand" (matched without case) from BOTH tables:
--     - public.perfumes: its own perfume pages (added in the "many more houses" import; none of them have
--       notes, similar scents or a picture chosen yet).
--     - public.dupes: the handful of listings where a Dua Brand item is shown as a SIMILAR SCENT under
--       another perfume's page (for example "Plumlicious" under Tom Ford Plum Japonais). Removing these
--       explicitly matters: deleting the perfumes rows above only clears their own page link
--       (dupes.inspired_perfume_id -> NULL), it does NOT remove the listing itself.
--   If any member ever rated, reviewed, shelved or voted on one of these perfumes, that row would be removed
--   too (the tables were built with ON DELETE CASCADE) - the dry run below reports how many such rows exist,
--   so you see this before applying. As of 2026-09-27 these perfumes are brand new and have none.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  n_perfumes int;
  n_dupes int;
  n_ratings int;
  n_reviews int;
  n_collections int;
  n_votes int;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfumes_backup_dua_2026_09_27') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The backup table "perfumes_backup_dua_2026_09_27" already exists - this removal already ran.';
  END IF;

  CREATE TABLE public.perfumes_backup_dua_2026_09_27 AS SELECT * FROM public.perfumes WHERE lower(brand) = lower('The Dua Brand');
  ALTER TABLE public.perfumes_backup_dua_2026_09_27 ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.perfumes_backup_dua_2026_09_27 FROM anon, authenticated;

  CREATE TABLE public.dupes_backup_dua_2026_09_27 AS SELECT * FROM public.dupes WHERE lower(brand) = lower('The Dua Brand');
  ALTER TABLE public.dupes_backup_dua_2026_09_27 ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.dupes_backup_dua_2026_09_27 FROM anon, authenticated;

  SELECT count(*) INTO n_ratings FROM public.ratings r JOIN public.perfumes p ON p.id = r.perfume_id WHERE lower(p.brand) = lower('The Dua Brand');
  SELECT count(*) INTO n_reviews FROM public.reviews r JOIN public.perfumes p ON p.id = r.perfume_id WHERE lower(p.brand) = lower('The Dua Brand');
  SELECT count(*) INTO n_collections FROM public.collections c JOIN public.perfumes p ON p.id = c.perfume_id WHERE lower(p.brand) = lower('The Dua Brand');
  SELECT count(*) INTO n_votes FROM public.perfume_votes v JOIN public.perfumes p ON p.id = v.perfume_id WHERE lower(p.brand) = lower('The Dua Brand');

  DELETE FROM public.dupes WHERE lower(brand) = lower('The Dua Brand');
  GET DIAGNOSTICS n_dupes = ROW_COUNT;

  DELETE FROM public.perfumes WHERE lower(brand) = lower('The Dua Brand');
  GET DIAGNOSTICS n_perfumes = ROW_COUNT;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would remove % perfumes and % similar-scent listings. Member data that would go with them: % ratings, % reviews, % shelf marks, % rating-panel votes. Change dry_run to false to apply.',
      n_perfumes, n_dupes, n_ratings, n_reviews, n_collections, n_votes;
  END IF;
  RAISE NOTICE 'Done: % perfumes and % similar-scent listings removed.', n_perfumes, n_dupes;
END $$;

SELECT count(*) AS dua_brand_left FROM public.perfumes WHERE lower(brand) = lower('The Dua Brand');
