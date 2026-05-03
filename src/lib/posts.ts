/**
 * Cross-collection helpers for the homepage and listing pages.
 *
 * We keep each collection schema separate (richer types) but expose a
 * normalized "PostSummary" shape for cards/lists.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type PostType =
  | "review"
  | "tier-list"
  | "top-10"
  | "hot-take"
  | "trivia";

export type PostSummary = {
  type: PostType;
  /** Public URL */
  href: string;
  title: string;
  publishDate: Date;
  excerpt?: string;
  posterUrl?: string;
  /** For reviews only — overall score 0–100 */
  overall?: number;
  /** Used for tier list previews */
  tierCount?: number;
  /** Used for top-10 previews */
  itemCount?: number;
};

const TYPE_LABELS: Record<PostType, string> = {
  review: "Review",
  "tier-list": "Tier List",
  "top-10": "Top 10",
  "hot-take": "Hot Take",
  trivia: "Trivia",
};

export function typeLabel(t: PostType): string {
  return TYPE_LABELS[t];
}

export function typeBadgeClasses(t: PostType): string {
  switch (t) {
    case "review":
      return "bg-popcorn/40 text-ink";
    case "tier-list":
      return "bg-marquee/15 text-marquee";
    case "top-10":
      return "bg-emerald-500/20 text-emerald-800";
    case "hot-take":
      return "bg-crimson/15 text-crimson";
    case "trivia":
      return "bg-amber-500/20 text-amber-800";
  }
}

function slugFromId(id: string): string {
  return id.replace(/\.md$/, "");
}

function publishedOnly<T extends { data: { draft?: boolean } }>(entries: T[]): T[] {
  return entries.filter((e) => !e.data.draft);
}

function sortByDateDesc<T extends { data: { publishDate: Date } }>(arr: T[]): T[] {
  return arr.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export async function getReviews(): Promise<CollectionEntry<"reviews">[]> {
  return sortByDateDesc(publishedOnly(await getCollection("reviews")));
}

export async function getTierLists(): Promise<CollectionEntry<"tier-lists">[]> {
  return sortByDateDesc(publishedOnly(await getCollection("tier-lists")));
}

export async function getTop10s(): Promise<CollectionEntry<"top-10">[]> {
  return sortByDateDesc(publishedOnly(await getCollection("top-10")));
}

export async function getHotTakes(): Promise<CollectionEntry<"hot-takes">[]> {
  return sortByDateDesc(publishedOnly(await getCollection("hot-takes")));
}

export async function getTrivia(): Promise<CollectionEntry<"trivia">[]> {
  return sortByDateDesc(publishedOnly(await getCollection("trivia")));
}

/* ---------------- summary mappers (for cards on home/list pages) -------- */

export function reviewToSummary(r: CollectionEntry<"reviews">): PostSummary {
  const overall = r.data.rating
    ? r.data.rating.story +
      r.data.rating.visuals +
      r.data.rating.characters +
      r.data.rating.acting +
      r.data.rating.music
    : undefined;
  return {
    type: "review",
    href: `/reviews/${slugFromId(r.id)}`,
    title: r.data.title,
    publishDate: r.data.publishDate,
    excerpt: r.data.excerpt,
    posterUrl: r.data.movie?.posterUrl,
    overall,
  };
}

export function tierListToSummary(t: CollectionEntry<"tier-lists">): PostSummary {
  return {
    type: "tier-list",
    href: `/tier-lists/${slugFromId(t.id)}`,
    title: t.data.title,
    publishDate: t.data.publishDate,
    excerpt: t.data.excerpt,
    posterUrl: t.data.coverImageUrl,
    tierCount: t.data.tiers?.length ?? 0,
  };
}

export function top10ToSummary(t: CollectionEntry<"top-10">): PostSummary {
  return {
    type: "top-10",
    href: `/top-10/${slugFromId(t.id)}`,
    title: t.data.title,
    publishDate: t.data.publishDate,
    excerpt: t.data.excerpt,
    posterUrl: t.data.coverImageUrl ?? t.data.items?.[0]?.posterUrl,
    itemCount: t.data.items?.length ?? 0,
  };
}

export function hotTakeToSummary(h: CollectionEntry<"hot-takes">): PostSummary {
  return {
    type: "hot-take",
    href: `/hot-takes/${slugFromId(h.id)}`,
    title: h.data.title,
    publishDate: h.data.publishDate,
    excerpt: h.data.excerpt,
    posterUrl: h.data.movie?.posterUrl,
  };
}

export function triviaToSummary(t: CollectionEntry<"trivia">): PostSummary {
  return {
    type: "trivia",
    href: `/trivia/${slugFromId(t.id)}`,
    title: t.data.title,
    publishDate: t.data.publishDate,
    excerpt: t.data.excerpt,
    posterUrl: t.data.movie?.posterUrl,
  };
}
