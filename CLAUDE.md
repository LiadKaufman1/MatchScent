@AGENTS.md

# MatchScent

A perfume website. It lists popular (expensive) original perfumes and, for each one, shows "inspired by" alternatives (dupes) with a similarity score, prices, and links to buy in Israel and abroad (Amazon).

## Working rules (mandatory)

1. **Never push directly to `main`.** Always create a new branch, commit there, push the branch, and open a pull request. Vercel builds a preview for every PR so the owner can check it before it goes live. Only the owner merges to `main`.
2. **Never commit secrets or API keys.** `.env.local` must stay untracked (it is covered by `.env*` in `.gitignore`). Do not print, copy, or paste the values from `.env.local` anywhere, including chat, code, docs, and commit messages. Refer to variables by name only.
3. **Always ask the owner before changing the database structure or deleting data in Supabase.** This means creating/altering/dropping tables or columns, changing RLS policies, running any `DELETE`, `DROP`, `TRUNCATE`, or re-running the `replace_dupes*.sql` files. Explain what will change and wait for a clear yes.
4. **Explain every change in simple terms.** The owner is not a professional developer. Before and after each change, say what it does and why, in plain language, without jargon.

## Product decisions (from the owner)

- **Never use the word "dupe"** (or "clone", "knockoff", "fake", "replica") in anything a visitor can see: page text, page titles, meta descriptions, URLs, image alt text, button labels. Use "Inspired by" or "Similar scents" instead. Reason: the owner wants to avoid legal claims. Internal names such as the `dupes` table and `Dupe` type may stay for now; renaming the database needs the owner's approval (rule 3).
- **Where the pairings come from:** today they come from a Google search for "<perfume> dupe", which the owner does not like. The preferred method is Fragrantica's "This perfume reminds me of" tab, picking the "inspired by" fragrances by hand. Do NOT bulk-scrape Fragrantica; ask the owner first (its terms of use restrict copying its content).
- **Look and feel:** fast, and clearly premium/expensive: black and gold.
- **International:** the store links a visitor sees depend on their country (Israel: Israeli shops and stores that ship to Israel; USA: US stores; same idea for the rest of the world).
- **SerpApi is on the free plan** (small monthly quota): do not add new SerpApi calls casually.
- **The GitHub repo is public.** Anything committed is visible to everyone. No secrets, no hard-coded passwords, and no private notes in the repo.
- Git is set up on the owner's machine; the assistant may commit and push **branches** (never `main`) and share the link to open the pull request.

## Tech stack

- Next.js 16.3.5 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4, framer-motion (animations), lucide-react (icons)
- Supabase (`@supabase/supabase-js`) for the database
- SerpApi (Google Shopping / Amazon search) for live prices
- Hosting: Vercel. GitHub `main` auto-deploys to production. There is no `vercel.json`; Vercel uses the default Next.js build (`npm run build`).

This Next.js version has breaking changes; read `node_modules/next/dist/docs/` before writing Next.js code (see AGENTS.md).

## Folder structure

```
src/app/page.tsx                      Public home page (client component): search, perfume grid, dupes popup
src/app/layout.tsx                    Fonts (Inter, Playfair Display) + site metadata
src/app/globals.css                   Global styles
src/app/components/LivePriceButtons.tsx   "Buy in Israel" / "Amazon" buttons inside each dupe card
src/app/admin/page.tsx                Admin page (server component, password-gated)
src/app/admin/components/LoginForm.tsx, AdminDashboard.tsx
src/lib/supabase.ts                   Public Supabase client (anon key) + TypeScript types Perfume, Dupe, LivePrice
src/lib/supabase-admin.ts             Server-only Supabase client (service role key, bypasses RLS)
src/lib/actions.ts                    Server actions: admin login/logout, update/add/delete perfumes and dupes
src/lib/search-prices.ts              Server action: fetch live prices from SerpApi and cache them in Supabase
src/lib/mockData.ts                   20 fake perfumes used as a fallback if Supabase is empty/unreachable
*.sql, generate_seed.js (repo root)   One-off database scripts (see "Database")
next.config.mjs                       The active Next config (allows images from images.unsplash.com)
next.config.ts                        UNUSED: Next loads .mjs first, so this file is ignored
```

## How data loads

- Home page (`/`): the browser itself asks Supabase (anon key) for ALL rows of `perfumes` and `dupes`, then filters/searches in memory. If Supabase returns nothing or errors, it silently falls back to `mockData.ts`.
- Clicking a perfume opens a popup listing its dupes (matched by `dupes.original_perfume_id`, sorted by `similarity_score`).
- Clicking "Buy in Israel" / "Amazon" on a dupe calls the `fetchLivePrices` server action. It first checks the cached `live_prices_il` / `live_prices_amazon` columns; if empty, it queries SerpApi, keeps the 3 cheapest valid results, and saves them back to the `dupes` row.
- `/admin`: password login (cookie `admin_token`), then lists everything and lets the owner edit perfumes/dupes and delete dupes via server actions using the service role key.

## Database (Supabase)

Reconstructed from the code and SQL files (there is no migrations folder, so the live database has not been verified against this).

**`perfumes`**: `id` (uuid, PK), `name`, `brand`, `image_url`, `description`, `price_usd`, `price_ils`, `gender` ('male' | 'female' | 'unisex'), `created_at`

**`dupes`**: `id` (uuid, PK), `original_perfume_id` (uuid, FK to `perfumes.id`, ON DELETE CASCADE), `name`, `brand`, `image_url`, `similarity_score` (int, 1-100), `price_usd`, `price_ils`, `purchase_link_il`, `purchase_link_amazon`, `notes`, `live_prices_il` (jsonb), `live_prices_amazon` (jsonb), `created_at`

RLS is enabled on both tables with public read-only (`SELECT`) policies (`fix_rls.sql`). All writes go through the service role key on the server.

SQL files in the repo root: `supabase_setup.sql` (create tables + first 20 perfumes), `add_live_prices.sql` (adds the jsonb columns), `fix_rls.sql`, `seed_100_perfumes.sql`, `replace_dupes.sql` / `replace_dupes_batch2.sql` (contain `DELETE FROM dupes` + hundreds of INSERTs with hard-coded IDs; do NOT re-run), `generate_seed.js` (generated the seed data).

## Environment variables

Set locally in `.env.local` (git-ignored) and in Vercel Project Settings, never in code:

| Variable | Used for | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | yes (by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read access | yes (by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin writes, bypasses RLS | NO, server only |
| `ADMIN_PASSWORD` | Admin login + cookie signing | NO, server only |
| `SERPAPI_KEY` | Live price lookups | NO, server only |

## Commands

```bash
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build (currently passes)
npm run lint     # ESLint (currently reports 19 errors, 3 warnings; Vercel does not run it)
```

## Known problems (see owner discussion before fixing)

- `fetchLivePrices` is a public server action that uses the service role key and the SerpApi key, and trusts the name/brand sent by the browser. Anyone can call it to burn SerpApi credits or write junk into the price cache.
- `actions.ts` falls back to a hard-coded default password if `ADMIN_PASSWORD` is missing, and `updateDupe`/`addDupe` accept any fields (`any`).
- Home page loads every row in the browser and delays each card animation by `index * 0.05s`, so it gets slower as perfumes are added; the page is client-rendered, which is weak for Google/SEO.
- Only 6 stock Unsplash photos are reused for every perfume and dupe.
- Live price cache never expires.
- The admin "Add Dupe" button does nothing (the `addDupe` action exists but is not wired up).
- `purchase_link_il` / `purchase_link_amazon` are stored but the public site no longer shows them.
- Default README, unused files (`next.config.ts`), ESLint errors, and root-level SQL/scripts need cleanup.
