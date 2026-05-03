/**
 * TMDb details fetch — pulls full metadata + credits for a chosen movie.
 *
 *   GET /api/tmdb-details?id=27205
 *
 * Returns: { title, year, director, runtime, posterUrl, backdropUrl, tmdbId, genres }
 */
import type { APIRoute } from "astro";

export const prerender = false;

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

type Crew = { job?: string; name?: string };
type TmdbMovieDetail = {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { name: string }[];
  credits?: { crew?: Crew[] };
};

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.TMDB_API_KEY ?? process.env.TMDB_API_KEY;
  if (!apiKey) return json({ error: "TMDB_API_KEY not configured" }, 500);

  const id = url.searchParams.get("id")?.trim();
  if (!id) return json({ error: "Missing id" }, 400);

  const tmdbUrl = new URL(`${TMDB_BASE}/movie/${encodeURIComponent(id)}`);
  tmdbUrl.searchParams.set("api_key", apiKey);
  tmdbUrl.searchParams.set("append_to_response", "credits");
  tmdbUrl.searchParams.set("language", "en-US");

  try {
    const r = await fetch(tmdbUrl.toString());
    if (!r.ok) return json({ error: `TMDb ${r.status}` }, 502);
    const m = (await r.json()) as TmdbMovieDetail;

    const directorName = m.credits?.crew?.find((c) => c.job === "Director")?.name;

    return json({
      tmdbId: m.id,
      title: m.title,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : undefined,
      runtime: typeof m.runtime === "number" ? m.runtime : undefined,
      director: directorName,
      posterUrl: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : undefined,
      backdropUrl: m.backdrop_path ? `${BACKDROP_BASE}${m.backdrop_path}` : undefined,
      genres: m.genres?.map((g) => g.name) ?? [],
    });
  } catch (err) {
    return json({ error: String(err) }, 502);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=600, s-maxage=3600",
      "access-control-allow-origin": "*",
    },
  });
};
