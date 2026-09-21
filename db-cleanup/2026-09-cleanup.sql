-- =====================================================================
-- MatchScent database cleanup   (PROPOSAL: read it before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in:
--   Supabase dashboard -> SQL Editor -> paste ALL of it -> Run
--
-- HOW IT WORKS
--  * The whole script is ONE block, so it is all-or-nothing: if anything
--    fails, nothing is changed.
--  * It starts as a DRY RUN (dry_run := true below). A dry run ends with a red
--    message that is EXPECTED. It contains the summary numbers, and NOTHING
--    is saved (not even the backups).
--  * If the summary matches "expected" below, change  dry_run := true  to
--    dry_run := false  and run again. That saves the changes.
--  * Also recommended before the real run: Table Editor -> perfumes and dupes
--    -> Export to CSV, as an extra backup.
--
-- WHAT IT DOES (tested on a copy of the live data)
--   0. Backup: copies both tables to perfumes_backup_20260921 and
--      dupes_backup_20260921 (public access switched off on the copies).
--   1. Perfumes stored twice (same brand + name): move the entries of the
--      older copy to the newer copy.                          expected: 15
--   2. Delete entries copied from Google Shopping: wording like "dupe" or
--      "clone" in the text, or an image not from images.unsplash.com (those
--      images do not load on the site).                       expected: 291
--   3. Delete exact duplicate entries (same perfume + brand + name), keeping
--      the highest similarity score.                           expected: 15
--   4. Delete the older duplicate perfume copies (now empty).  expected: 18
--
-- EXPECTED RESULT: perfumes 130 -> 112, entries 337 -> 31, orphans 0.
-- The script stops (and undoes everything) if any orphan entry would remain.
-- No column or table is changed, apart from the two backup tables in step 0.
-- =====================================================================

DO $$
DECLARE
  dry_run       boolean := true;   -- <<< change to false to APPLY the changes
  p_before      int;
  d_before      int;
  moved         int;
  risky         int;
  dup_entries   int;
  dup_perfumes  int;
  p_after       int;
  d_after       int;
  orphans       int;
BEGIN
  -- make sure the tables are looked up in the "public" schema (some SQL editors do not)
  PERFORM set_config('search_path', 'public, extensions', true);

  SELECT count(*) INTO p_before FROM perfumes;
  SELECT count(*) INTO d_before FROM dupes;

  -- Step 0: backups (RLS on with no policy = not readable through the public API)
  CREATE TABLE perfumes_backup_20260921 AS TABLE perfumes;
  CREATE TABLE dupes_backup_20260921    AS TABLE dupes;
  ALTER TABLE perfumes_backup_20260921 ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dupes_backup_20260921    ENABLE ROW LEVEL SECURITY;

  -- Step 1: move entries from the older copy of a perfume to the newer copy
  WITH pairs AS (
    SELECT DISTINCT ON (o.id) o.id AS old_id, n.id AS new_id
    FROM perfumes o
    JOIN perfumes n
      ON lower(trim(o.brand)) = lower(trim(n.brand))
     AND lower(trim(o.name))  = lower(trim(n.name))
     AND o.created_at < n.created_at
    ORDER BY o.id, n.created_at DESC
  )
  UPDATE dupes d
  SET original_perfume_id = p.new_id
  FROM pairs p
  WHERE d.original_perfume_id = p.old_id;
  GET DIAGNOSTICS moved = ROW_COUNT;

  -- Step 2: delete Google-sourced / risky entries.
  -- Entries with NO image are kept on purpose: the new Fragrantica-based entries have none.
  DELETE FROM dupes
  WHERE (image_url IS NOT NULL AND image_url NOT LIKE 'https://images.unsplash.com/%')
     OR (coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(notes, ''))
          ~* '\m(dupes?|clones?|knock-?offs?|replicas?|fakes?|counterfeit)\M';
  GET DIAGNOSTICS risky = ROW_COUNT;

  -- Step 3: delete exact duplicate entries, keep the highest similarity score
  DELETE FROM dupes a
  USING dupes b
  WHERE a.original_perfume_id = b.original_perfume_id
    AND lower(trim(a.brand)) = lower(trim(b.brand))
    AND lower(trim(a.name))  = lower(trim(b.name))
    AND a.id <> b.id
    AND (a.similarity_score < b.similarity_score
         OR (a.similarity_score = b.similarity_score AND a.id > b.id));
  GET DIAGNOSTICS dup_entries = ROW_COUNT;

  -- Step 4: delete the older duplicate perfume copies (their entries were moved in step 1)
  DELETE FROM perfumes o
  USING perfumes n
  WHERE lower(trim(o.brand)) = lower(trim(n.brand))
    AND lower(trim(o.name))  = lower(trim(n.name))
    AND o.created_at < n.created_at;
  GET DIAGNOSTICS dup_perfumes = ROW_COUNT;

  SELECT count(*) INTO p_after FROM perfumes;
  SELECT count(*) INTO d_after FROM dupes;
  SELECT count(*) INTO orphans
  FROM dupes d
  WHERE NOT EXISTS (SELECT 1 FROM perfumes p WHERE p.id = d.original_perfume_id);

  IF orphans <> 0 THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved: % entries would be left without a perfume.', orphans;
  END IF;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Perfumes % -> % (older copies deleted: %). Entries % -> % (moved: %, risky/broken deleted: %, duplicate entries deleted: %). Orphans: %.',
      p_before, p_after, dup_perfumes, d_before, d_after, moved, risky, dup_entries, orphans;
  END IF;
END $$;

-- Only reached after a real run (dry_run := false): shows the final numbers.
SELECT (SELECT count(*) FROM public.perfumes) AS perfumes_now,
       (SELECT count(*) FROM public.dupes)    AS entries_now;
