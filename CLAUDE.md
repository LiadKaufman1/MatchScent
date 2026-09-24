@AGENTS.md

# MatchScent

A perfume website. It lists popular (expensive) original perfumes and, for each one, shows "inspired by" alternatives with links to compare prices and buy in the visitor's country. Hebrew (right-to-left, the default language) and English. Since 2026-09 it is also becoming a Hebrew-first, Israeli Parfumo/Fragrantica-style community site: accounts, ratings, reviews, notes, votes, shelves.

## Working rules (mandatory)

1. **Never push directly to `main`.** Always create a new branch, commit there, push the branch, and open a pull request. Vercel builds a preview for every PR so the owner can check it before it goes live. Only the owner merges to `main`. Before pushing to an existing branch, check the PR is still open (`gh pr view N --json state`): a merged branch's later commits never reach `main`.
2. **Never commit secrets or API keys.** `.env.local` must stay untracked (it is covered by `.env*` in `.gitignore`). Do not print, copy, or paste the values from `.env.local` anywhere, including chat, code, docs, and commit messages. Refer to variables by name only.
3. **Always ask the owner before changing the database structure or deleting data in Supabase.** This means creating/altering/dropping tables or columns, changing RLS policies, running any `DELETE`, `DROP`, `TRUNCATE`, or re-running the `replace_dupes*.sql` files. Explain what will change and wait for a clear yes. The assistant never runs SQL against the database itself: it writes a reviewable script (dry run first) and the owner runs it in the Supabase SQL Editor.
4. **Explain every change in simple terms, in Hebrew.** The owner is not a professional developer and speaks Hebrew. Before and after each change, say what it does and why, in plain language, without jargon.

## Product decisions (from the owner)

- **Never use the word "dupe"** (or "clone", "knockoff", "fake", "replica", "counterfeit") in anything a visitor can see: page text, titles, meta descriptions, URLs, image alt text, button labels. Use "Inspired by" / "Similar scents". Reason: the owner wants to avoid legal claims. Internal names such as the `dupes` table and `Dupe` type may stay; renaming the database needs the owner's approval (rule 3). `src/lib/catalog.ts` also hides any entry that contains such a word.
- **Look and feel:** clean, elegant and premium: white background with burgundy/plum accents and near-black text (black and gold was tried and rejected). Font: Heebo (Latin + Hebrew), fairly bold and very readable, loaded with `next/font` in `src/lib/fonts.ts`. Fast pages (server-rendered, ISR).
- **Bilingual:** Hebrew is the default and owns the plain URLs (`/`, `/perfume/<slug>`, RTL); English lives under `/en` (`/en/perfume/<slug>`). Old `/he/...` addresses redirect. Every visible string is in `src/lib/i18n.ts` (both languages); use the `withLang()` helper for links. A language toggle and hreflang tags exist.
- **Accessibility:** an accessibility button (text size, contrast, link highlight, readable font, stop animations) and an accessibility statement page. Set `NEXT_PUBLIC_CONTACT_EMAIL` so the statement shows a contact address.
- **Price comparison is the main button:** "Compare prices across stores in {country}" (Google Shopping) is the most prominent action on every entry, above the individual store buttons.
- **Store links by country** (`src/lib/stores.ts`): Israel (KSP, Super-Pharm), USA, UK, and a world fallback. The country comes from the `x-vercel-ip-country` header (`/api/country`) and the visitor can change it. Only store search URLs that were verified in a real browser are used; do not add stores without checking them.
- **Where the pairings come from:** Fragrantica's "This perfume reminds me of" list. Rules: only fragrances with more likes than dislikes, best first (likes minus dislikes), top 5, **never the same brand** as the original, at least 10 votes, several versions of one fragrance count once, no supermarket/body-care lines (see `scripts/fragrantica-import.mjs`). The owner decided to proceed with automated collection despite Fragrantica's terms (which restrict it): the assistant read the pages one by one at a slow pace and took only names and vote counts, never bypassing a CAPTCHA or block. Stop if a CAPTCHA or block appears. Do not copy Fragrantica's text or images into the repo.
- **Photos:** real fragrance photos are wanted. Decided so far: an affiliate feed (Amazon Associates / Awin-Notino) for the well-known originals, brand press images for the smaller houses, and moderated user uploads later. On 2026-09-23 the owner also approved a **local review step**: `scripts/download-image-candidates.mjs` searches Google Images (through SerpApi) and downloads a few candidates per perfume into the git-ignored `data-import/images/`, with the source page of each in `manifest.json`. On the owner's request (2026-09-23) it also has `--source fragrantica`, which takes each perfume's own Fragrantica picture (`fimgs.net/mdimg/perfume/o.<id>.jpg`, slow, and it stops at the first 403/429: Fragrantica answered 429 once when its perfume list pages were fetched too fast, so keep every request to that site slow). Nothing from it is committed, uploaded or shown on the site automatically; before a picture goes live, check where it came from (brand or retailer pictures first) and keep the source for takedown requests. Never scrape Google result pages directly, never bypass a CAPTCHA, and never hotlink images from Google or Fragrantica. **Going live (owner asked for all pictures on the site, 2026-09-23):** `prepare-site-images.mjs` -> owner runs `db-migrations/2026-09-perfume-images-bucket.sql` (dry run first) -> `upload-site-images.mjs` -> owner runs `data-import/site-images.sql` (dry run first, keeps a backup of the old image_url values). The pictures are stored in Supabase Storage, never in the repo, so a takedown request means deleting one file. The footer says product pictures belong to their owners and offers removal on request (set `NEXT_PUBLIC_CONTACT_EMAIL`); `data-import/images/manifest.json` records where every picture came from. Perfumes without a picture keep the placeholder (`PerfumeArt`).
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
src/app/(he)/…            Hebrew site at the root: layout, home, perfume/[slug], accessibility, login, register, u/[id], not-found
src/app/en/…              English site under /en (same pages)
src/app/(admin)/…         Admin login + dashboard (own layout, password-gated)
src/app/api/country/      Returns the visitor's country
src/app/components/       Catalog, EntryCard, StoreButtons, CountrySelect, A11yWidget, SiteChrome, Photo, PerfumeArt, RootDocument
src/app/sitemap.ts, robots.ts   Sitemap (both languages, with alternates) and robots
src/views/                Page bodies shared by English and Hebrew (HomeView, PerfumeView, ProfileView, AuthView, AccessibilityView, NotFoundView)
src/lib/i18n.ts           All text, English + Hebrew, helpers getDict / fmt / withLang / otherLang
src/lib/stores.ts         Countries, stores, search-URL builders, compareUrl()
src/lib/load-catalog.ts   Loads perfumes + entries (cached), slugs, per-perfume page data
src/lib/catalog.ts        Cleans the data: hides risky/broken entries, merges duplicate perfumes
src/lib/images.ts         isRealPhoto(): only /perfumes/… or Supabase Storage URLs count as real photos
src/lib/actions.ts        Admin server actions (login, edit/add/delete), whitelisted fields, refreshes public pages
src/lib/supabase.ts, supabase-admin.ts   Public (anon) and server-only (service role) clients, both created lazily
src/lib/auth-actions.ts, community-actions.ts   Login/register/logout and rating/review/vote/shelf server actions (anon key + the visitor's own session; RLS enforces ownership)
src/lib/supabase-server.ts, supabase-browser.ts, use-viewer.ts, middleware.ts   Cookie-session Supabase clients, "who is looking" hook, session refresh
src/lib/community-types.ts   Types/constants shared by server and browser code (aspects, review, votes)
src/lib/notes.ts, notes-he.ts   Note pyramid helpers and the Hebrew names of notes (a note missing there shows in English)
src/app/components/      ...also AuthStatus, AuthForm, RatingsReviews, EntryVotes, ShelfButtons, NotePyramid
src/lib/site.ts, site-metadata.ts, fonts.ts, slug.ts, format.ts, a11y-store.ts, use-country.ts, mockData.ts
scripts/fragrantica-import.mjs   Ranking rules -> report + reviewable SQL (see below)
scripts/fragrantica-refresh-report.mjs   Monthly "what are we missing?" report (new releases vs. our catalog)
scripts/lib/rules.mjs            Shared rules: same-brand check, excluded budget brands, inspired-side houses
scripts/download-image-candidates.mjs   Downloads candidate bottle photos to data-import/images/ for the owner to review
scripts/prepare-site-images.mjs   Normalizes the chosen pictures (800x1000, white) + writes the image_url SQL (data-import/site-images*)
scripts/upload-site-images.mjs    Uploads them to the public Supabase bucket "perfume-images"
scripts/merge-collected.mjs      Merges slow in-browser collections (data-import/collected-*.json) into picture numbers + notes
scripts/notes-to-sql.mjs         Notes -> reviewable SQL (data-import/notes.sql) + list of notes lacking a Hebrew name
db-migrations/                   Owner-run SQL for new tables/columns (dry run first): accounts-and-reviews, perfume-images-bucket, community-v2-and-notes
db-cleanup/2026-09-cleanup.sql   Database cleanup script (dry run by default, run by the owner)
data-import/                     LOCAL ONLY, git-ignored: collected lists, generated SQL and reports
next.config.mjs                  The active Next config
```

## Community features (Hebrew-first, Parfumo/Fragrantica-style)

Replicate the mechanics, never their content or exact design. All per-visitor state (am I logged in, my rating/vote/shelf) is read in the browser (`useViewer`), so pages stay static/ISR; public numbers (averages, vote counts, shelf counts) come from the server. Every write is a server action using the visitor's own session; the database's RLS (public read, owner-only write) is the real guard. Registration currently needs no email confirmation (no domain yet); turn "Confirm email" on and set up SMTP before launch.

- Done: accounts; Fragrantica-style "User ratings" panels on every perfume page (rating love/like/ok/dislike/hate stored as ratings.score 5..1, when to wear winter/spring/summer/fall/day/night, longevity, sillage, gender, price value in `perfume_votes`, plus optional Parfumo-style scent/bottle stars); short pros/cons written by members with thumbs up/down (`perfume_points`, `point_votes`); reviews with "helpful" votes (`review_votes`); "does it smell like the original?" yes/no votes per inspired-by entry; shelf (own/had/want); member page `/u/<id>` (noindex) with bio, shelf, ratings and reviews, editable by its owner; notes pyramid, year, perfumers and main accords per perfume.
- Do NOT copy Fragrantica's/Parfumo's texts, AI summaries, vote numbers or note pictures; facts (note names, year, perfumer, accord names) are fine. Nothing here is generated from their user votes.
- Votes are keyed by perfume + fragrance slug (not the entry row id) because the import script deletes and re-inserts entries; a re-import must never wipe community data. Do not put foreign keys to `dupes.id` on community tables.
- Also done: brand pages `/brand/<slug>` (perfumes of the brand + its fragrances that appear as inspired-by) and note pages `/notes/<slug>` (every fragrance with that note; pages with fewer than 3 hits are noindex and not in the sitemap); admin moderation page `/admin/community` (delete any review or pro/con).
- v4 (`db-migrations/2026-09-community-v4-photos-comments-suggestions.sql`): replies on reviews (`review_comments`); "I smell this note" votes (`note_votes`, bigger chips for notes many members smell); members' own bottle photos (`perfume_photos`, max 3 per member per perfume, shrunk in the browser to 1400 px JPEG, checked on the server by their first bytes, stored in the PRIVATE bucket `photo-uploads`, copied to the public bucket `community-photos` only when the owner approves in `/admin/community`); suggestions (`suggestions`: a similar scent for a perfume, never the same brand, or a missing perfume; the owner can fix spelling and approve, which inserts into `dupes` with similarity_score 50 or into `perfumes`). Home page community band (latest reviews, top rated, most wanted, new photos, "suggest a perfume"), `/top` charts (Bayesian top rated, most loved/wanted/owned/reviewed, most active members), `/suggest`. Members' texts containing the blocked words (dupe, clone...) are refused with a polite message (`hasBlockedWord` in catalog.ts).
- Ideas not built yet: user-submitted perfumes for approval, ads (AdSense, the owner's own account).

## How data loads

- Pages are server-rendered from Supabase (anon key) and revalidated every 5 minutes (ISR), so database changes appear within about 5 minutes; admin edits refresh the public pages immediately (`refreshPublicPages()`).
- Each perfume has its own page (`/perfume/<slug>`, `/he/perfume/<slug>`) with JSON-LD, hreflang and a sitemap entry. Perfumes that have entries are listed first.
- Entries are ordered by `similarity_score` (the Fragrantica import stores 100, 95, 90, 85, 80 just to keep the order).
- `/admin`: password login (cookie `admin_token`, timing-safe compare, no default password), edits via server actions using the service role key. Server actions are public POST endpoints: always validate and whitelist fields.

## Database (Supabase, project "MatchScent")

**`perfumes`**: `id` (uuid, PK), `name`, `brand`, `image_url`, `description`, `price_usd`, `price_ils`, `gender` ('male' | 'female' | 'unisex'), `created_at`

**Community tables** (see `db-migrations/`; v3 = `perfume_votes`, `perfume_points`, `point_votes`, `review_votes`, `perfumes.year/perfumers/accords`, `profiles.bio`): `profiles` (id = auth user), `ratings` (score 1-5 + optional scent/longevity/sillage/bottle/value), `reviews`, `entry_votes` (perfume_id, entry_key, vote +1/-1), `collections` (user_id, perfume_id, status own/had/want). `perfumes.note_pyramid` and `dupes.note_pyramid` (jsonb: `{top, heart, base}` or `{notes}`, English names). All new reads fall back to "nothing yet" when a migration has not run.

**`dupes`**: `id` (uuid, PK), `original_perfume_id` (uuid, FK to `perfumes.id`, ON DELETE CASCADE), `name`, `brand`, `image_url`, `similarity_score` (int, 1-100), `price_usd`, `price_ils`, `purchase_link_il`, `purchase_link_amazon`, `notes`, `live_prices_il` (jsonb), `live_prices_amazon` (jsonb), `created_at`

RLS is enabled with public read-only (`SELECT`) policies. Writes go through the service role key on the server only. The Supabase SQL Editor may not have `public` in its `search_path`; scripts do `PERFORM set_config('search_path','public, extensions', true)` and qualify tables with `public.`.

State (audited 2026-09-21): 130 perfumes (112 unique, 18 duplicated copies), older entries were mostly Google-sourced junk. `db-cleanup/2026-09-cleanup.sql` removes duplicates and the Google-sourced entries (backups `perfumes_backup_20260921`, `dupes_backup_20260921`); it keeps entries that have no image (the new Fragrantica ones). The 50 first perfumes already got their Fragrantica entries (250 rows) on 2026-09-21.

Old SQL files in the repo root (`supabase_setup.sql`, `add_live_prices.sql`, `fix_rls.sql`, `seed_100_perfumes.sql`, `replace_dupes*.sql`, `generate_seed.js`) are one-off history; do NOT re-run `replace_dupes*.sql` (they delete data).

## Fragrantica import workflow

1. Collect each perfume's "This perfume reminds me of" list in the built-in browser (the section is lazy: front the tab, scroll slowly, wait). Save into `data-import/fragrantica-scraped.json`; headings `### N. Brand | Name` (exact names as in the database) go in `data-import/fragrantica-30.txt`.
2. `node scripts/fragrantica-import.mjs` writes `data-import/fragrantica-result.txt` (readable report of every decision) and `data-import/fragrantica-import.sql`.
3. The owner runs the SQL in Supabase: first as a dry run (ends with a red message that lists counts and saves nothing), then with `dry_run := false`. It is all-or-nothing and creates a backup table of the replaced entries. The assistant never runs it.
4. Check the live site (up to 5 minutes for ISR).

## Talking to Fragrantica: the pace that works (learned 2026-09-23)

- Parfumo (the fallback, owner-approved 2026-09-24) serves light pages (~125 KB): search `https://www.parfumo.com/s_perfumes_x.php?in=1&filter=<brand+name>` then the perfume page (`.pyramid_block` = notes, `Main accords`, year, `/Perfumers/` links). 2 requests per fragrance at 12-18 s pace worked for 67 fragrances without a block; results go to `data-import/collected-parfumo-N.json` (`{"Brand|Name": {blocks, accords, year, perfumers}}`) and `scripts/notes-to-sql.mjs` reads them. Parfumo has no Fragrantica ids, so it cannot feed the picture downloader.
- Their perfume and designer pages are 2-3 MB each. Fetching them one every 9-15 s from the built-in browser still got HTTP 429 after only 21 requests (after an earlier 429 the same week). So the safe budget is far lower than "one every 10 s": a few dozen requests per session, a long pause after any 429 (hours), never retry in a loop.
- 2026-09-24: 303 designer pages in a row at 30-45 s apart (a plain `fetch` loop in a background tab) went through with no block at all, so steady spacing of ~40 s is the working pace; the earlier blocks came from bursts. The loop pauses 3 hours on any non-200 and then tries one page again (never a tight retry).
- Owner's picture budget: at most ~300 new pictures per day from fimgs.net (`download-image-candidates.mjs` caps each run at 300; count what already ran that day). The owner prefers Fragrantica as the picture source (not Parfumo).
- Prefer one request that answers many questions: a designer page gives the Fragrantica number of every fragrance of that brand (numbers are in the links: `/perfume/<Brand>/<Name>-<id>.html`); the picture host `fimgs.net` is separate and was never blocked (still keep ~6 s between pictures, max 300 new per run).
- The in-page collector is a plain `fetch` loop with a queue, results kept in `window`, stopping at the first non-200; save results into `data-import/collected-N.json`, then `node scripts/merge-collected.mjs`.

## Keeping the catalog fresh (monthly refresh)

The pairings are a snapshot; new "inspired" fragrances and new popular originals appear all the time. Monthly, with the owner's approval of every change:

1. **Find new releases.** Fetch the designer pages of the "inspired-side" houses (Lattafa, Armaf, Maison Alhambra, French Avenue, Afnan, Rasasi, Rayhaan, Khadlaj, Paris Corner, ...) from `https://www.fragrantica.com/designers/<House>.html` from within the built-in browser (one plain request per house, 2-3 s apart). Each row shows year and votes; keep year >= last year and votes >= 100.
2. **Read each new fragrance's "This perfume reminds me of" list** (slowly, one page at a time, same extractor as the import). Store as `data-import/refresh-scraped.json`; snapshot the site's catalog as `data-import/catalog-snapshot.json` (public read).
3. `node scripts/fragrantica-refresh-report.mjs` writes `data-import/refresh-report.txt`: (1) new "inspired by" candidates for perfumes we already have, (2) popular originals that are not on the site yet.
4. The owner decides. Approved additions go through the normal import flow (`fragrantica-import.mjs` -> reviewable SQL -> owner runs it, dry run first). New originals need a `perfumes` row first (SQL, owner runs it).
5. Also re-read the lists of the original perfumes every few months: they gain new fragrances as votes accumulate.

Findings from the first run (2026-09-21): only ~10% of the lists of new fragrances point at perfumes we already have; most point at popular originals we do not list yet (Azzaro The Most Wanted, D&G Devotion, Amouage Outlands, Hugo Boss Bottled Absolu, Gucci Flora Gorgeous Orchid, ...). So growing the list of originals matters as much as re-reading the existing ones.

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

- Owner runs first `db-migrations/2026-09-community-v3-ratings-panels.sql`, then `data-import/notes.sql` (rebuilt by `node scripts/notes-to-sql.mjs` whenever more facts are collected; Parfumo fallback: `data-import/collected-parfumo-*.json`). Earlier order (each dry run first): `db-migrations/2026-09-community-v2-and-notes.sql`, then `data-import/notes.sql`; the 10-options import (`node scripts/fragrantica-import.mjs --top 10` -> `data-import/fragrantica-import.sql`); then upload pictures (`upload-site-images.mjs`) and run `data-import/site-images.sql`.
- Still to collect slowly from Fragrantica: notes of ~100 more originals, picture numbers of ~500 more inspired fragrances (brands beyond the first 11), notes of inspired fragrances.

- Photos and prices for the new entries (legal source undecided: affiliate feed vs own photos).
- Run the database cleanup script (PR #2), then import the remaining perfumes.
- Buy a domain, then set `NEXT_PUBLIC_SITE_URL`; set `NEXT_PUBLIC_CONTACT_EMAIL`.
- Unknown URLs show the default 404 (a fully custom 404 needs `global-not-found`).
