@AGENTS.md

# MatchScent

A perfume website. It lists popular (expensive) original perfumes and, for each one, shows "inspired by" alternatives with links to compare prices and buy in the visitor's country. Hebrew (right-to-left) and English.

## Working rules (mandatory)

1. **Never push directly to `main`.** Always create a new branch, commit there, push the branch, and open a pull request. Vercel builds a preview for every PR so the owner can check it before it goes live. Only the owner merges to `main`. Before pushing to an existing branch, check the PR is still open (`gh pr view N --json state`): a merged branch's later commits never reach `main`.
2. **Never commit secrets or API keys.** `.env.local` must stay untracked (it is covered by `.env*` in `.gitignore`). Do not print, copy, or paste the values from `.env.local` anywhere, including chat, code, docs, and commit messages. Refer to variables by name only.
3. **Always ask the owner before changing the database structure or deleting data in Supabase.** This means creating/altering/dropping tables or columns, changing RLS policies, running any `DELETE`, `DROP`, `TRUNCATE`, or re-running the `replace_dupes*.sql` files. Explain what will change and wait for a clear yes. The assistant never runs SQL against the database itself: it writes a reviewable script (dry run first) and the owner runs it in the Supabase SQL Editor.
4. **Explain every change in simple terms, in Hebrew.** The owner is not a professional developer and speaks Hebrew. Before and after each change, say what it does and why, in plain language, without jargon.

## Product decisions (from the owner)

- **Never use the word "dupe"** (or "clone", "knockoff", "fake", "replica", "counterfeit") in anything a visitor can see: page text, titles, meta descriptions, URLs, image alt text, button labels. Use "Inspired by" / "Similar scents". Reason: the owner wants to avoid legal claims. Internal names such as the `dupes` table and `Dupe` type may stay; renaming the database needs the owner's approval (rule 3). `src/lib/catalog.ts` also hides any entry that contains such a word.
- **Look and feel:** clean, elegant and premium: white background with burgundy/plum accents and near-black text (black and gold was tried and rejected). Font: Heebo (Latin + Hebrew), fairly bold and very readable, loaded with `next/font` in `src/lib/fonts.ts`. Fast pages (server-rendered, ISR).
- **Bilingual:** English keeps the original URLs (`/`, `/perfume/<slug>`), Hebrew lives under `/he` (RTL). Every visible string is in `src/lib/i18n.ts` (both languages); use the `withLang()` helper for links. A language toggle and hreflang tags exist.
- **Accessibility:** an accessibility button (text size, contrast, link highlight, readable font, stop animations) and an accessibility statement page. Set `NEXT_PUBLIC_CONTACT_EMAIL` so the statement shows a contact address.
- **Price comparison is the main button:** "Compare prices across stores in {country}" (Google Shopping) is the most prominent action on every entry, above the individual store buttons.
- **Store links by country** (`src/lib/stores.ts`): Israel (KSP, Super-Pharm), USA, UK, and a world fallback. The country comes from the `x-vercel-ip-country` header (`/api/country`) and the visitor can change it. Only store search URLs that were verified in a real browser are used; do not add stores without checking them.
- **Where the pairings come from:** Fragrantica's "This perfume reminds me of" list. Rules: only fragrances with more likes than dislikes, best first (likes minus dislikes), top 5, **never the same brand** as the original, at least 10 votes, several versions of one fragrance count once, no supermarket/body-care lines (see `scripts/fragrantica-import.mjs`). The owner decided to proceed with automated collection despite Fragrantica's terms (which restrict it): the assistant read the pages one by one at a slow pace and took only names and vote counts, never bypassing a CAPTCHA or block. Stop if a CAPTCHA or block appears. Do not copy Fragrantica's text or images into the repo.
- **Photos:** real fragrance photos are wanted, but only from a legal source (own photos, brand/retailer permission, an affiliate product feed). Never hotlink or copy images from Google or Fragrantica. Until then entries show an elegant placeholder (`PerfumeArt`). Undecided: affiliate route (Amazon, Notino/Awin) vs own photos.
- **Long-term goal:** SEO and affiliate income. A domain will be bought later; then set `NEXT_PUBLIC_SITE_URL`.
- **Live site:** https://match-scent-6ev8.vercel.app (Vercel project `match-scent-6ev8`, the only project kept). The five variables below must be set for **both Production and Preview** in Vercel or previews fail. Vercel previews are private (login required).
- **The GitHub repo is public.** Anything committed is visible to everyone. No secrets, no hard-coded passwords, no private notes, and no third-party data dumps (`data-import/` is git-ignored).
- The assistant may commit and push **branches** (never `main`) and open pull requests with `gh` (logged in as the owner).

## Tech stack

- Next.js 16.3.5 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4, lucide-react (icons)
- Supabase (`@supabase/supabase-js`) for the database
- Hosting: Vercel. GitHub `main` auto-deploys to production. No `vercel.json`; the default Next.js build (`npm run build`).
- No SerpApi any more (live price lookups were removed; `SERPAPI_KEY` in Vercel is unused and can be deleted).

This Next.js version has breaking changes; read `node_modules/next/dist/docs/` before writing Next.js code (see AGENTS.md). `params` is a Promise; pages use `export const revalidate = 300` (ISR) and `generateStaticParams`.

## Folder structure

```
src/app/(en)/…            English site: layout, home page, perfume/[slug], accessibility, not-found
src/app/he/…              Hebrew site (same pages, RTL)
src/app/(admin)/…         Admin login + dashboard (own layout, password-gated)
src/app/api/country/      Returns the visitor's country
src/app/components/       Catalog, EntryCard, StoreButtons, CountrySelect, A11yWidget, SiteChrome, Photo, PerfumeArt, RootDocument
src/app/sitemap.ts, robots.ts   Sitemap (both languages, with alternates) and robots
src/views/                Page bodies shared by English and Hebrew (HomeView, PerfumeView, AccessibilityView, NotFoundView)
src/lib/i18n.ts           All text, English + Hebrew, helpers getDict / fmt / withLang / otherLang
src/lib/stores.ts         Countries, stores, search-URL builders, compareUrl()
src/lib/load-catalog.ts   Loads perfumes + entries (cached), slugs, per-perfume page data
src/lib/catalog.ts        Cleans the data: hides risky/broken entries, merges duplicate perfumes
src/lib/images.ts         isRealPhoto(): only /perfumes/… or Supabase Storage URLs count as real photos
src/lib/actions.ts        Admin server actions (login, edit/add/delete), whitelisted fields, refreshes public pages
src/lib/supabase.ts, supabase-admin.ts   Public (anon) and server-only (service role) clients, both created lazily
src/lib/site.ts, site-metadata.ts, fonts.ts, slug.ts, format.ts, a11y-store.ts, use-country.ts, mockData.ts
scripts/fragrantica-import.mjs   Ranking rules -> report + reviewable SQL (see below)
db-cleanup/2026-09-cleanup.sql   Database cleanup script (dry run by default, run by the owner)
data-import/                     LOCAL ONLY, git-ignored: collected lists, generated SQL and reports
next.config.mjs                  The active Next config
```

## How data loads

- Pages are server-rendered from Supabase (anon key) and revalidated every 5 minutes (ISR), so database changes appear within about 5 minutes; admin edits refresh the public pages immediately (`refreshPublicPages()`).
- Each perfume has its own page (`/perfume/<slug>`, `/he/perfume/<slug>`) with JSON-LD, hreflang and a sitemap entry. Perfumes that have entries are listed first.
- Entries are ordered by `similarity_score` (the Fragrantica import stores 100, 95, 90, 85, 80 just to keep the order).
- `/admin`: password login (cookie `admin_token`, timing-safe compare, no default password), edits via server actions using the service role key. Server actions are public POST endpoints: always validate and whitelist fields.

## Database (Supabase, project "MatchScent")

**`perfumes`**: `id` (uuid, PK), `name`, `brand`, `image_url`, `description`, `price_usd`, `price_ils`, `gender` ('male' | 'female' | 'unisex'), `created_at`

**`dupes`**: `id` (uuid, PK), `original_perfume_id` (uuid, FK to `perfumes.id`, ON DELETE CASCADE), `name`, `brand`, `image_url`, `similarity_score` (int, 1-100), `price_usd`, `price_ils`, `purchase_link_il`, `purchase_link_amazon`, `notes`, `live_prices_il` (jsonb), `live_prices_amazon` (jsonb), `created_at`

RLS is enabled with public read-only (`SELECT`) policies. Writes go through the service role key on the server only. The Supabase SQL Editor may not have `public` in its `search_path`; scripts do `PERFORM set_config('search_path','public, extensions', true)` and qualify tables with `public.`.

State (audited 2026-09-21): 130 perfumes (112 unique, 18 duplicated copies), older entries were mostly Google-sourced junk. `db-cleanup/2026-09-cleanup.sql` removes duplicates and the Google-sourced entries (backups `perfumes_backup_20260921`, `dupes_backup_20260921`); it keeps entries that have no image (the new Fragrantica ones). The 50 first perfumes already got their Fragrantica entries (250 rows) on 2026-09-21.

Old SQL files in the repo root (`supabase_setup.sql`, `add_live_prices.sql`, `fix_rls.sql`, `seed_100_perfumes.sql`, `replace_dupes*.sql`, `generate_seed.js`) are one-off history; do NOT re-run `replace_dupes*.sql` (they delete data).

## Fragrantica import workflow

1. Collect each perfume's "This perfume reminds me of" list in the built-in browser (the section is lazy: front the tab, scroll slowly, wait). Save into `data-import/fragrantica-scraped.json`; headings `### N. Brand | Name` (exact names as in the database) go in `data-import/fragrantica-30.txt`.
2. `node scripts/fragrantica-import.mjs` writes `data-import/fragrantica-result.txt` (readable report of every decision) and `data-import/fragrantica-import.sql`.
3. The owner runs the SQL in Supabase: first as a dry run (ends with a red message that lists counts and saves nothing), then with `dry_run := false`. It is all-or-nothing and creates a backup table of the replaced entries. The assistant never runs it.
4. Check the live site (up to 5 minutes for ISR).

## Environment variables

Set locally in `.env.local` (git-ignored) and in Vercel Project Settings (Production + Preview), never in code:

| Variable | Used for | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | yes (by design; Vercel type "Config") |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read access | yes (by design; "Config") |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin writes, bypasses RLS | NO, server only ("Sensitive") |
| `ADMIN_PASSWORD` | Admin login + cookie signing | NO, server only ("Sensitive") |
| `NEXT_PUBLIC_SITE_URL` | Canonical site address (set once a domain exists; otherwise `VERCEL_PROJECT_PRODUCTION_URL` is used) | yes |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address in the accessibility statement | yes |

## Commands

```bash
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

If `tsc`/build reports stale route types after moving files, delete the `.next` folder and build again. On Windows, files may have CRLF line endings; edit with tools that tolerate that.

## Open items

- Photos and prices for the new entries (legal source undecided: affiliate feed vs own photos).
- Run the database cleanup script (PR #2), then import the remaining perfumes.
- Buy a domain, then set `NEXT_PUBLIC_SITE_URL`; set `NEXT_PUBLIC_CONTACT_EMAIL`.
- Unknown URLs show the default 404 (a fully custom 404 needs `global-not-found`).
