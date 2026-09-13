-- Add JSONB columns for storing cached live prices from SerpApi
ALTER TABLE dupes
ADD COLUMN IF NOT EXISTS live_prices_il JSONB,
ADD COLUMN IF NOT EXISTS live_prices_amazon JSONB;
