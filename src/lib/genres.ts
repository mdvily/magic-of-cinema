export const GENRES = [
  "Action",
  "Animation",
  "Comedy",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Suspense",
  "Thriller",
] as const;

export type Genre = (typeof GENRES)[number];

export function genreSlug(g: Genre): string {
  return g.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
