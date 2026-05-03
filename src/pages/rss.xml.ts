/**
 * RSS feed combining all post types — newest first.
 */
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import {
  getReviews,
  getTierLists,
  getTop10s,
  getHotTakes,
  getTrivia,
  reviewToSummary,
  tierListToSummary,
  top10ToSummary,
  hotTakeToSummary,
  triviaToSummary,
  typeLabel,
  type PostSummary,
} from "../lib/posts.ts";

export const GET: APIRoute = async (context) => {
  const [reviews, tierLists, top10s, hotTakes, trivia] = await Promise.all([
    getReviews(),
    getTierLists(),
    getTop10s(),
    getHotTakes(),
    getTrivia(),
  ]);

  const items: PostSummary[] = [
    ...reviews.map(reviewToSummary),
    ...tierLists.map(tierListToSummary),
    ...top10s.map(top10ToSummary),
    ...hotTakes.map(hotTakeToSummary),
    ...trivia.map(triviaToSummary),
  ].sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf());

  return rss({
    title: "Magic of Cinema",
    description: "Movie reviews, tier lists, hot takes & trivia by MovieMan.",
    site: context.site ?? "https://magic-of-cinema.vercel.app",
    items: items.map((item) => ({
      title: `[${typeLabel(item.type)}] ${item.title}`,
      pubDate: item.publishDate,
      description: item.excerpt ?? "",
      link: item.href,
    })),
    customData: `<language>en-us</language>`,
  });
};
