-- =====================================================================
-- MatchScent: a storage folder ("bucket") for perfume-house logos   (PROPOSAL, review before running)
-- =====================================================================
-- Claude has NOT run this. You run it yourself in Supabase -> SQL Editor.
--  * It starts as a DRY RUN (dry_run := true). A dry run ends with a red message that is EXPECTED;
--    nothing is created.
--  * If the message looks right, change  dry_run := true  to  dry_run := false  and run again.
--
-- WHAT IT DOES
--   Only ADDS one thing: a public storage bucket called "brand-logos", limited to small pictures up to
--   300 KB (jpeg / png / webp) - that is plenty for a logo. "Public" means anyone can VIEW a logo if they
--   know its address - that is what the website needs. Nobody can upload, replace or delete through the
--   public key: there is no policy that allows it. Only the owner's server-side key (used by
--   scripts/upload-brand-logos.mjs) can write. No table, column or row is touched: the website finds a
--   house's logo by its own web address (brands.slug), the same way it already finds perfume pictures.
-- =====================================================================

DO $$
DECLARE
  dry_run boolean := true;   -- <<< change to false to APPLY
BEGIN
  PERFORM set_config('search_path', 'public, extensions', true);

  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-logos') THEN
    RAISE EXCEPTION 'STOPPED, nothing was changed. The bucket "brand-logos" already exists.';
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('brand-logos', 'brand-logos', true, 307200, ARRAY['image/jpeg', 'image/png', 'image/webp']);

  IF dry_run THEN
    RAISE EXCEPTION 'DRY RUN OK, nothing was saved. Would create the public bucket "brand-logos" (pictures up to 300 KB).';
  END IF;
END $$;

-- Only reached after a real run: confirms the bucket exists.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'brand-logos';
