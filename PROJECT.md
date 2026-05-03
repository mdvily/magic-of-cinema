# Magic of Cinema — Project Notes

## Overview
Movie review blog for Mike's 14-year-old son, writing under pen name **MovieMan**.

## Spec snapshot
- **URL:** `https://magic-of-cinema.vercel.app` (canonical; `magicofcinema.vercel.app` resolves as alias)
- **Stack:** Astro + Tailwind + TinaCMS + TMDb + Giscus
- **Vibe:** Fun & playful, with RogerEbert.com inspiration (strong typography, review-forward, but more color and personality)
- **Comments:** Giscus (GitHub Discussions-backed)
- **Publish flow:** MovieMan publishes freely → Telegram ping to Mike

## Accounts
- **GitHub:** `mdvily` (mdvily@gmail.com) — needs Vercel + TinaCMS connections, repo TBD (suggested: `magic-of-cinema`)
- **TMDb:** API key stored in `.env` (NOT committed). Mike pasted in chat 2026-05-02 → rotate after launch.
- **Vercel:** TBD (sign up via GitHub)
- **TinaCMS:** TBD (sign up at app.tina.io)

## Privacy guardrails (non-negotiable)
- Pen name only, no real name on the site
- No photos of him
- No location/school/age specifics
- EXIF stripped from any uploaded images
- robots.txt with AI scraper preferences
- Privacy policy page

## Rating system (LOCKED)
- **Overall score:** 0–100, displayed as a big bold number ("MovieMan Verdict: 87")
- **Subcategories** (each 0–20 popcorn buckets, whole numbers only):
  - 📖 Story
  - 🎨 Visuals
  - 👥 Characters
  - 🎭 Acting
  - 🎵 Music
- **Overall = sum of subs** (auto-computed in TinaCMS, not manually entered)
- **No decimals**, whole buckets only
- Subs displayed as 0–20 popcorn rows; overall as a big number
- **Verdict labels (LOCKED, MovieMan-authored):**
  - 90–100 🏆 Cinematic Masterpiece
  - 80–89 🔥 Awesome
  - 70–79 👍 Bueno
  - 50–69 😐 Mid
  - 30–49 👎 No Bueno
  - 0–29 💀 Neck No!
- TBD: per-category rubric on About page — default ON, MovieMan to author

## Content types (LOCKED, 2026-05-02 v0.2 refactor)

Each is a distinct collection with its own schema, editor, and template:

| Collection | URL | Editor shape | Renderer |
|---|---|---|---|
| `reviews` | `/reviews/<slug>` | body + popcorn ratings + movie info | review page with RatingCard |
| `tier-lists` | `/tier-lists/<slug>` | intro body + editable tier groups (name, hex color, cards) | TierListView (rows of cards) |
| `top-10` | `/top-10/<slug>` | intro body + ordered ranked items (title/year/poster/desc) | Top10View (countdown #N → #1) |
| `hot-takes` | `/hot-takes/<slug>` | body + optional movie | dramatic header treatment |
| `trivia` | `/trivia/<slug>` | body + optional movie | "did you know" callout treatment |
| `about` (singleton) | `/about` | body + avatar | rendered from content collection |

## Repo (LOCKED)
`magic-of-cinema`

## Pending decisions
- First post / launch movie (MovieMan's pick)
- Per-category rubric on About page — default ON, MovieMan to author later

## Build status

### ✅ Done (v0.1, 2026-05-02)
- Astro + Tailwind v4 scaffolded
- Content collection schema with rating validation (zod)
- Rating utilities (computeOverall, verdictFor, verdictClasses)
- Components: BaseLayout, SiteHeader, SiteFooter, RatingBar, RatingCard, ReviewCard
- Pages: home, /reviews, /reviews/[slug], /categories/[category], /about, /rating-system, /privacy
- Two seed posts (welcome.md, dune-part-two.md)
- robots.txt with AI-scraper opt-outs
- favicon
- Build passes, all 12 routes render 200
- Dev server runs at localhost:4321

### ✅ Also done (v0.2, 2026-05-02 evening)
- TinaCMS writing UI live at /admin
- 6 collections (reviews, tier-lists, top-10, hot-takes, trivia, about) each with type-appropriate editor
- Custom tier list builder (editable tier names, hex color picker, card builder)
- Top 10 builder with ranked items, mini-card rendering
- About page now editable via Tina (singleton)
- Vercel auto-deploy from main branch
- Tina Cloud project + token wired into Vercel env vars

### ⏳ Still to wire (v0.3+)
- TMDb poster auto-fill (paste a movie title → poster + metadata pre-filled)
- Giscus comments
- Telegram publish webhook (ping Mike on deploy)
- Sitemap + RSS
- Custom 404 page
- MovieMan-authored per-category rubric content on About page

## Notes to self
- Spawn Claude Code as sub-agent for the build
- Keep TMDb key out of git, use Vercel env vars
- Test that Giscus works without leaking GitHub usernames in weird ways
- Telegram publish ping: probably a Vercel deploy webhook → small handler that hits Mike's bot
