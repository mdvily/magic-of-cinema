import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Rating subcategories — each scored 0–20 (whole numbers only).
 * Overall rating (0–100) is the sum of these five, computed at render time.
 */
const ratingSchema = z.object({
  story: z.number().int().min(0).max(20),
  visuals: z.number().int().min(0).max(20),
  characters: z.number().int().min(0).max(20),
  acting: z.number().int().min(0).max(20),
  music: z.number().int().min(0).max(20),
});

/**
 * Categories MovieMan can post under.
 * Locked list — adding more later requires a code change (intentional).
 */
const categorySchema = z.enum([
  "Reviews",
  "Top 10 Lists",
  "Trivia",
  "Hot Takes",
  "Tier Lists",
]);

/**
 * Movie metadata, typically auto-filled from TMDb but editable.
 * Optional because non-review posts (Trivia, Tier Lists) may not be about one specific movie.
 */
const movieSchema = z
  .object({
    title: z.string(),
    year: z.number().int().optional(),
    director: z.string().optional(),
    runtime: z.number().int().optional(), // minutes
    posterUrl: z.string().url().optional(),
    backdropUrl: z.string().url().optional(),
    tmdbId: z.number().int().optional(),
    genres: z.array(z.string()).optional(),
  })
  .optional();

const reviews = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reviews" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: categorySchema,
    tags: z.array(z.string()).default([]),
    excerpt: z.string().max(280).optional(),
    movie: movieSchema,
    rating: ratingSchema.optional(), // optional — non-review posts may not have one
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  reviews,
};
