import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { SITE } from "../../../lib/resend";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function slugFromId(id: string) {
  return id.replace(/\.md$/, "");
}

function withinDays(date: Date, days: number): boolean {
  return date >= new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const DAYS = 7;
  const dateLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const [reviews, tierLists, top10s, hotTakes, trivia] = await Promise.all([
    getCollection("reviews"),
    getCollection("tier-lists"),
    getCollection("top-10"),
    getCollection("hot-takes"),
    getCollection("trivia"),
  ]);

  const newReviews = reviews.filter((e) => !e.data.draft && withinDays(e.data.publishDate, DAYS));
  const newTierLists = tierLists.filter((e) => !e.data.draft && withinDays(e.data.publishDate, DAYS));
  const newTop10s = top10s.filter((e) => !e.data.draft && withinDays(e.data.publishDate, DAYS));
  const newHotTakes = hotTakes.filter((e) => !e.data.draft && withinDays(e.data.publishDate, DAYS));
  const newTrivia = trivia.filter((e) => !e.data.draft && withinDays(e.data.publishDate, DAYS));

  // Top fan requests
  const [{ data: requests }, { data: votes }] = await Promise.all([
    supabase.from("movie_requests").select("id, title, year, status").eq("status", "active"),
    supabase.from("request_votes").select("request_id, vote"),
  ]);

  const voteTotals: Record<string, number> = {};
  for (const v of votes ?? []) {
    voteTotals[v.request_id] = (voteTotals[v.request_id] ?? 0) + v.vote;
  }
  const topRequests = (requests ?? [])
    .map((r) => ({ ...r, total: voteTotals[r.id] ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Build markdown
  const lines: string[] = [
    `Hey there! Here's what's been happening at Magic of Cinema this week.`,
    ``,
  ];

  if (newReviews.length > 0) {
    lines.push(`## 📝 New Reviews`, ``);
    for (const r of newReviews) {
      const slug = slugFromId(r.id);
      const movie = r.data.movie?.title ?? r.data.title;
      lines.push(`**[${r.data.title}](${SITE}/reviews/${slug})** — ${r.data.excerpt ?? `MovieMan reviews ${movie}.`}`, ``);
    }
  }

  const otherPosts = [
    ...newTierLists.map((e) => ({ title: e.data.title, href: `${SITE}/tier-lists/${slugFromId(e.id)}`, type: "Tier List", excerpt: e.data.excerpt })),
    ...newTop10s.map((e) => ({ title: e.data.title, href: `${SITE}/top-10/${slugFromId(e.id)}`, type: "Top 10", excerpt: e.data.excerpt })),
    ...newHotTakes.map((e) => ({ title: e.data.title, href: `${SITE}/hot-takes/${slugFromId(e.id)}`, type: "Hot Take", excerpt: e.data.excerpt })),
    ...newTrivia.map((e) => ({ title: e.data.title, href: `${SITE}/trivia/${slugFromId(e.id)}`, type: "Trivia", excerpt: e.data.excerpt })),
  ];

  if (otherPosts.length > 0) {
    lines.push(`## 🎬 More from MovieMan`, ``);
    for (const p of otherPosts) {
      lines.push(`**[${p.title}](${p.href})** *(${p.type})* — ${p.excerpt ?? p.title}`, ``);
    }
  }

  if (topRequests.length > 0) {
    lines.push(`## 🍿 Top Fan Requests`, ``);
    lines.push(`Vote for what MovieMan reviews next!`, ``);
    topRequests.forEach((r, i) => {
      const votes = r.total > 0 ? `+${r.total}` : `${r.total}`;
      lines.push(`${i + 1}. **${r.title}**${r.year ? ` (${r.year})` : ""} — ${votes} ${Math.abs(r.total) === 1 ? "vote" : "votes"}`);
    });
    lines.push(``, `[See all requests and vote →](${SITE}/requests)`, ``);
  }

  if (newReviews.length === 0 && otherPosts.length === 0) {
    lines.push(`It's been a quiet week — MovieMan is cooking up something new. Stay tuned.`, ``);
  }

  const body_md = lines.join("\n");
  const subject = `MovieMan's Weekly Digest — ${dateLabel}`;

  const { data, error } = await supabase
    .from("newsletters")
    .insert({ subject, body_md })
    .select()
    .single();

  if (error) {
    return json({ error: "Failed to save draft" }, 500);
  }

  return json({ ok: true, newsletter: data });
};
