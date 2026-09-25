-- =====================================================================
-- MatchScent: reports of problems sent by visitors ("Report a problem")          (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * All-or-nothing (a single transaction).
--
-- WHAT IT DOES
--   It only ADDS one new table; it deletes nothing and changes nothing that exists.
--   site_reports: one row per report a visitor sends from the "Report a problem" page: the text, the page they came
--   from, an optional way to reach them (email or phone, only if they choose to write it), the language and the time.
--   Nobody can read or write it from the website's public side (no policies at all); only the site's server
--   (with its private key) writes it, and you read it in /admin/reports (or in Supabase).
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_reports') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The table "site_reports" already exists - this migration already ran.';
  END IF;

  CREATE TABLE public.site_reports (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    message     text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
    page        text CHECK (page IS NULL OR char_length(page) <= 300),
    contact     text CHECK (contact IS NULL OR char_length(contact) <= 200),
    lang        text,
    handled     boolean NOT NULL DEFAULT false
  );
  CREATE INDEX site_reports_time_idx ON public.site_reports (created_at DESC);

  -- Locked: RLS on and no policy, so the public (anon) and members (authenticated) can neither read nor write.
  ALTER TABLE public.site_reports ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.site_reports FROM anon, authenticated;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would create the table site_reports. Change dry_run to false to apply.';
  END IF;
  RAISE NOTICE 'Done: site_reports created.';
END $$;

SELECT count(*) AS reports_so_far FROM public.site_reports;
