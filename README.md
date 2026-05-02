# 🎬 Magic of Cinema

Movie reviews, ranked lists, hot takes & tier lists by **MovieMan**.

Live: https://magicofcinema.vercel.app

## Stack

- **Astro** (static site generator)
- **Tailwind CSS v4** (styling)
- **TinaCMS** (writing UI — to be added)
- **TMDb** (movie posters/metadata — to be added)
- **Giscus** (comments — to be added)
- **Vercel** (hosting)

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
```

## Project structure

```
src/
├── components/      # Reusable UI (RatingCard, ReviewCard, etc.)
├── content/
│   └── reviews/     # Markdown posts (one file per post)
├── layouts/         # Page shell (BaseLayout)
├── lib/             # Utility code (rating math, verdict logic)
├── pages/           # Routes
└── styles/          # global.css with Tailwind theme tokens
```

## Adding a new review (manual workflow)

Until TinaCMS is wired up, posts live as markdown files in `src/content/reviews/`. Example:

```yaml
---
title: "The Movie Title — short hot take"
publishDate: 2026-05-15
category: "Reviews"   # or Top 10 Lists, Trivia, Hot Takes, Tier Lists
tags: ["sci-fi", "etc"]
excerpt: "One-line summary for cards."
movie:
  title: "The Movie Title"
  year: 2024
  director: "Some Person"
  runtime: 120
  posterUrl: "https://image.tmdb.org/t/p/w500/..."
rating:           # optional — only for reviews
  story: 18
  visuals: 20
  characters: 17
  acting: 19
  music: 19
draft: false
---

# Review body in markdown.
```

Overall score is auto-computed from the 5 subcategories — don't enter it manually.

## Rating system

Each review is scored 0–20 in five categories:

- 📖 Story
- 🎨 Visuals
- 👥 Characters
- 🎭 Acting
- 🎵 Music

Sum = overall score (0–100). Mapped to verdict bands:

| Score | Verdict |
|---|---|
| 90–100 | 🏆 Cinematic Masterpiece |
| 80–89 | 🔥 Awesome |
| 70–79 | 👍 Bueno |
| 50–69 | 😐 Mid |
| 30–49 | 👎 No Bueno |
| 0–29 | 💀 Neck No! |

## Roadmap (still to wire up)

- [ ] TinaCMS for the writing UI
- [ ] TMDb integration for poster auto-fill
- [ ] Giscus comments
- [ ] Telegram publish webhook (ping Mike on deploy)
- [ ] Sitemap (`@astrojs/sitemap`)
- [ ] RSS feed
- [ ] Custom 404 page
- [ ] Per-category rubric content on the About page
