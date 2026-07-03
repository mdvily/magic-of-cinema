import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = async () => {
  const [{ data: requests, error: reqErr }, { data: votes, error: voteErr }] =
    await Promise.all([
      supabase
        .from("movie_requests")
        .select("id, tmdb_id, title, year, poster_url, overview, director, runtime, status, submitted_at")
        .order("submitted_at", { ascending: false }),
      supabase.from("request_votes").select("request_id, vote"),
    ]);

  if (reqErr || voteErr) {
    return json({ error: "Failed to load requests" }, 500);
  }

  const totals: Record<string, number> = {};
  for (const v of votes ?? []) {
    totals[v.request_id] = (totals[v.request_id] ?? 0) + v.vote;
  }

  const ranked = (requests ?? [])
    .map((r) => ({
      id: r.id,
      tmdbId: r.tmdb_id,
      title: r.title,
      year: r.year,
      posterUrl: r.poster_url,
      overview: r.overview,
      director: r.director,
      runtime: r.runtime,
      status: r.status,
      submittedAt: r.submitted_at,
      voteTotal: totals[r.id] ?? 0,
    }))
    .sort((a, b) => b.voteTotal - a.voteTotal);

  return json({ requests: ranked });
};
