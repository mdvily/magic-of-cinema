import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: {
    tmdbId?: number;
    title?: string;
    year?: number;
    posterUrl?: string;
    backdropUrl?: string;
    director?: string;
    runtime?: number;
    overview?: string;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { tmdbId, title, year, posterUrl, backdropUrl, director, runtime, overview } = body;

  if (!tmdbId || !title) {
    return json({ error: "tmdbId and title are required" }, 400);
  }

  // Check if already reviewed in existing content
  const reviews = await getCollection("reviews");
  const existing = reviews.find((r) => r.data.movie?.tmdbId === tmdbId);
  if (existing) {
    return json(
      { error: "already_reviewed", reviewUrl: `/reviews/${existing.id}` },
      409
    );
  }

  // Check if already submitted (or picked/reviewed via this system)
  const { data: dupe } = await supabase
    .from("movie_requests")
    .select("id, status")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (dupe) {
    return json({ error: "already_submitted", status: dupe.status }, 409);
  }

  const { data, error } = await supabase
    .from("movie_requests")
    .insert({
      tmdb_id: tmdbId,
      title,
      year,
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      director,
      runtime,
      overview,
    })
    .select()
    .single();

  if (error) {
    console.error("submit error:", error);
    return json({ error: "Failed to submit" }, 500);
  }

  return json({ ok: true, request: data }, 201);
};
