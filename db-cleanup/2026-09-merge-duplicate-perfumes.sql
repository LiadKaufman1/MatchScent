-- =====================================================================
-- MatchScent: merge 3 perfumes that are on the site twice                          (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Read the numbers, then change to  dry_run := false  and run again.
--  * All-or-nothing (a single transaction). Backups of everything it touches are kept in
--    perfumes_merge_backup_2026_09_26 and dupes_merge_backup_2026_09_26 (public access off).
--
-- WHAT IT DOES - three pairs of the SAME perfume, each listed twice; one row of each pair is removed:
--   1. Giorgio Armani "Stronger With You"  (kept, has the similar scents and the notes)
--      Giorgio Armani "Emporio Armani Stronger With You"   (removed: added by the import of every Armani perfume)
--   2. Jo Malone London "Myrrh & Tonka"    (kept: the house name Fragrantica uses)
--      Jo Malone "Myrrh & Tonka"                            (removed; its 6 similar scents and its notes move to the kept row)
--   3. Jo Malone London "Wood Sage & Sea Salt" (kept)
--      Jo Malone "Wood Sage & Sea Salt"                     (removed; its 8 similar scents and its notes move to the kept row)
-- For each pair: the similar scents (list entries) of the removed row move to the kept row (an entry the kept row
-- already has is not duplicated), the notes / accords / perfumers / year / picture the kept row lacks are copied from
-- the removed row, and then the removed row is deleted.
--
-- SAFETY: it STOPS (nothing saved) if the row to be removed already has ratings, reviews, votes, shelf marks, photos or
-- suggestions from members - those would have to be moved by hand. Today they have none.
--
-- NOT merged on purpose (they look alike but are different perfumes - different year and audience): Mania / Armani Mania,
-- Y / Yves Saint Laurent Y, Forever and Ever / Forever and Ever Dior, Lily / Lily Dior.
--
-- The website redirects the two removed addresses (next.config.mjs), so old links keep working.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
  m record;
  fk record;
  v_keep uuid;
  v_drop uuid;
  n int;
  moved int;
  total_moved int := 0;
  pairs_done int := 0;
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfumes_merge_backup_2026_09_26') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The backup table "perfumes_merge_backup_2026_09_26" already exists - this merge already ran.';
  END IF;

  CREATE TEMP TABLE merge_pairs ON COMMIT DROP AS
    SELECT * FROM (VALUES
      ('Giorgio Armani',   'Stronger With You',    'Giorgio Armani', 'Emporio Armani Stronger With You'),
      ('Jo Malone London', 'Myrrh & Tonka',        'Jo Malone',      'Myrrh & Tonka'),
      ('Jo Malone London', 'Wood Sage & Sea Salt', 'Jo Malone',      'Wood Sage & Sea Salt')
    ) AS t(keep_brand, keep_name, drop_brand, drop_name);

  -- backups first
  CREATE TABLE public.perfumes_merge_backup_2026_09_26 AS
    SELECT p.* FROM public.perfumes p JOIN merge_pairs m
      ON (p.brand = m.keep_brand AND p.name = m.keep_name) OR (p.brand = m.drop_brand AND p.name = m.drop_name);
  ALTER TABLE public.perfumes_merge_backup_2026_09_26 ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.perfumes_merge_backup_2026_09_26 FROM anon, authenticated;

  CREATE TABLE public.dupes_merge_backup_2026_09_26 AS
    SELECT d.* FROM public.dupes d
      JOIN public.perfumes p ON p.id = d.original_perfume_id OR p.id = d.inspired_perfume_id
      JOIN merge_pairs m ON p.brand = m.drop_brand AND p.name = m.drop_name;
  ALTER TABLE public.dupes_merge_backup_2026_09_26 ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.dupes_merge_backup_2026_09_26 FROM anon, authenticated;

  FOR m IN SELECT * FROM merge_pairs LOOP
    SELECT count(*) INTO n FROM public.perfumes WHERE brand = m.keep_brand AND name = m.keep_name;
    IF n <> 1 THEN
      RAISE EXCEPTION 'STOPPED, nothing was saved. Expected exactly 1 perfume "% %" (to keep), found %.', m.keep_brand, m.keep_name, n;
    END IF;
    SELECT count(*) INTO n FROM public.perfumes WHERE brand = m.drop_brand AND name = m.drop_name;
    IF n <> 1 THEN
      RAISE EXCEPTION 'STOPPED, nothing was saved. Expected exactly 1 perfume "% %" (to remove), found %.', m.drop_brand, m.drop_name, n;
    END IF;
    SELECT id INTO v_keep FROM public.perfumes WHERE brand = m.keep_brand AND name = m.keep_name;
    SELECT id INTO v_drop FROM public.perfumes WHERE brand = m.drop_brand AND name = m.drop_name;

    -- members' data on the row to be removed: stop instead of losing it
    FOR fk IN
      SELECT c.conrelid AS tbl, a.attname AS col
      FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f' AND c.confrelid = 'public.perfumes'::regclass AND c.conrelid <> 'public.dupes'::regclass
    LOOP
      EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', fk.tbl, fk.col) INTO n USING v_drop;
      IF n > 0 THEN
        RAISE EXCEPTION 'STOPPED, nothing was saved. % has % row(s) about "% %" (to be removed): move them by hand first.', fk.tbl, n, m.drop_brand, m.drop_name;
      END IF;
    END LOOP;

    -- similar scents of the removed row move to the kept row (never twice)
    UPDATE public.dupes d SET original_perfume_id = v_keep
    WHERE d.original_perfume_id = v_drop
      AND NOT EXISTS (
        SELECT 1 FROM public.dupes k
        WHERE k.original_perfume_id = v_keep AND lower(k.brand) = lower(d.brand) AND lower(k.name) = lower(d.name));
    GET DIAGNOSTICS moved = ROW_COUNT;
    total_moved := total_moved + moved;

    -- a similar-scent entry that pointed at the removed row now points at the kept one
    UPDATE public.dupes SET inspired_perfume_id = v_keep WHERE inspired_perfume_id = v_drop;

    -- facts the kept row lacks
    UPDATE public.perfumes k SET
      note_pyramid = COALESCE(k.note_pyramid, d.note_pyramid),
      accords      = CASE WHEN k.accords   IS NULL OR cardinality(k.accords)   = 0 THEN d.accords   ELSE k.accords   END,
      perfumers    = CASE WHEN k.perfumers IS NULL OR cardinality(k.perfumers) = 0 THEN d.perfumers ELSE k.perfumers END,
      year         = COALESCE(k.year, d.year),
      description  = COALESCE(k.description, d.description),
      image_url    = COALESCE(NULLIF(k.image_url, ''), d.image_url),
      gender       = COALESCE(k.gender, d.gender)
    FROM public.perfumes d
    WHERE k.id = v_keep AND d.id = v_drop;

    DELETE FROM public.perfumes WHERE id = v_drop;
    pairs_done := pairs_done + 1;
  END LOOP;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would merge % pairs and move % similar-scent entries to the kept perfumes. Change dry_run to false to apply.', pairs_done, total_moved;
  END IF;
  RAISE NOTICE 'Done: % pairs merged, % similar-scent entries moved.', pairs_done, total_moved;
END $$;

-- after a real run: the three kept perfumes with their number of similar scents
SELECT p.brand, p.name, p.year, (SELECT count(*) FROM public.dupes d WHERE d.original_perfume_id = p.id) AS similar_scents
FROM public.perfumes p
WHERE (p.brand, p.name) IN (('Giorgio Armani', 'Stronger With You'), ('Jo Malone London', 'Myrrh & Tonka'), ('Jo Malone London', 'Wood Sage & Sea Salt'));
