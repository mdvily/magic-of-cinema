import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

/**
 * Magic of Cinema — content collections.
 *
 * Six collections, each with its own shape:
 *  - reviews     → body + popcorn ratings + movie info
 *  - tier-lists  → intro + editable tier groups with cards
 *  - top-10      → intro + ordered list of mini-card items
 *  - hot-takes   → body + optional movie association (dramatic treatment)
 *  - trivia      → body + optional movie association (fun-fact treatment)
 *  - about       → singleton page, body + optional avatar
 */

/* ------------------------------ shared bits ------------------------------ */

const movieSchema = z
  .object({
    title: z.string(),
    year: z.number().int().optional(),
    director: z.string().optional(),
    runtime: z.number().int().optional(),
    posterUrl: z.string().url().optional(),
    backdropUrl: z.string().url().optional(),
    tmdbId: z.number().int().optional(),
    genres: z.array(z.string()).optional(),
  })
  .optional();

const baseFields = {
  title: z.string(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().max(280).optional(),
  draft: z.boolean().default(false),
  genres: z.array(z.string()).optional(),
};

/* ---------------------------------- reviews ----------------------------- */

const ratingSchema = z.object({
  story: z.number().int().min(0).max(20),
  visuals: z.number().int().min(0).max(20),
  characters: z.number().int().min(0).max(20),
  acting: z.number().int().min(0).max(20),
  music: z.number().int().min(0).max(20),
});

const reviews = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reviews" }),
  schema: z.object({
    ...baseFields,
    movie: movieSchema,
    rating: ratingSchema.optional(),
  }),
});

/* --------------------------------- tier-lists --------------------------- */

const tierCardSchema = z.object({
  title: z.string(),
  posterUrl: z.string().url().optional(),
  description: z.string().optional(),
});

const tierGroupSchema = z.object({
  /** Letter grade or custom name (e.g. "S", "GOAT"). */
  name: z.string(),
  /** Hex color, e.g. "#f6c453" */
  color: z.string().default("#f6c453"),
  cards: z.array(tierCardSchema).default([]),
});

const tierLists = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tier-lists" }),
  schema: z.object({
    ...baseFields,
    coverImageUrl: z.string().url().optional(),
    tiers: z.array(tierGroupSchema).default([]),
  }),
});

/* ---------------------------------- top-10 ------------------------------ */

const topRankItemSchema = z.object({
  title: z.string(),
  year: z.number().int().optional(),
  posterUrl: z.string().url().optional(),
  description: z.string().optional(),
});

const top10 = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/top-10" }),
  schema: z.object({
    ...baseFields,
    coverImageUrl: z.string().url().optional(),
    /** Ordered #1 -> last; rendered as countdown (last -> #1) */
    items: z.array(topRankItemSchema).default([]),
  }),
});

/* ------------------------------ hot-takes ------------------------------- */

const hotTakes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/hot-takes" }),
  schema: z.object({
    ...baseFields,
    movie: movieSchema,
  }),
});

/* --------------------------------- trivia ------------------------------- */

const trivia = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/trivia" }),
  schema: z.object({
    ...baseFields,
    movie: movieSchema,
  }),
});

/* ---------------------------------- about ------------------------------- */
/* Singleton: a single about.md file. */

const about = defineCollection({
  loader: glob({ pattern: "about.md", base: "./src/content/about" }),
  schema: z.object({
    title: z.string().default("About MovieMan"),
    avatarUrl: z.string().url().optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

/* ----------------------------- export collections ----------------------- */

export const collections = {
  reviews,
  "tier-lists": tierLists,
  "top-10": top10,
  "hot-takes": hotTakes,
  trivia,
  about,
};
