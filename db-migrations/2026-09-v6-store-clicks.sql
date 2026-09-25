-- =====================================================================
-- MatchScent: count the clicks that leave the site towards a store          (PROPOSAL, review first)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is
--    EXPECTED; nothing is saved. Then change to  dry_run := false  and run again.
--  * All-or-nothing (a single transaction).
--
-- WHAT IT DOES
--   It only ADDS one new table and two views; it deletes nothing and changes nothing that exists.
--   store_clicks: one row per click on "To the store" (which store, which perfume, country, the price shown,
--   the bottle size, the language, the time). Nothing personal is stored: no address, no account, no browser.
--   Nobody can read or write it from the website's public side (no policies at all); only the site's server
--   (with its private key) writes it, and you read it in Supabase or in /admin/clicks.
--   store_click_months: clicks per store per month (the report you send to a store).
--   store_click_perfumes: clicks per perfume in the last 30 days.
-- =====================================================================
--
-- The monthly report for one store, after the migration ran (run it as a normal query):
--   SELECT store, month::date, clicks FROM public.store_click_months WHERE store ILIKE '%blendo%' ORDER BY month DESC;

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_clicks') THEN
    RAISE EXCEPTION 'STOPPED, nothing was saved. The table "store_clicks" already exists - this migration already ran.';
  END IF;

  CREATE TABLE public.store_clicks (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    store       text NOT NULL CHECK (char_length(store) BETWEEN 1 AND 120),
    perfume_key text NOT NULL CHECK (char_length(perfume_key) BETWEEN 1 AND 200),
    country     text NOT NULL CHECK (char_length(country) BETWEEN 1 AND 8),
    price       numeric,
    currency    text,
    size_ml     integer,
    lang        text
  );
  CREATE INDEX store_clicks_store_time_idx ON public.store_clicks (store, created_at DESC);
  CREATE INDEX store_clicks_time_idx ON public.store_clicks (created_at DESC);

  -- Locked: RLS on and no policy, so the public (anon) and members (authenticated) can neither read nor write.
  ALTER TABLE public.store_clicks ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.store_clicks FROM anon, authenticated;

  CREATE VIEW public.store_click_months WITH (security_invoker = true) AS
    SELECT store, date_trunc('month', created_at) AS month, count(*)::int AS clicks
    FROM public.store_clicks GROUP BY 1, 2;

  CREATE VIEW public.store_click_perfumes WITH (security_invoker = true) AS
    SELECT perfume_key, count(*)::int AS clicks
    FROM public.store_clicks WHERE created_at >= now() - interval '30 days' GROUP BY 1;

  REVOKE ALL ON public.store_click_months, public.store_click_perfumes FROM anon, authenticated;

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK - nothing was saved. Would create the table store_clicks and the views store_click_months and store_click_perfumes. Change dry_run to false to apply.';
  END IF;
  RAISE NOTICE 'Done: store_clicks created.';
END $$;

SELECT count(*) AS clicks_so_far FROM public.store_clicks;
