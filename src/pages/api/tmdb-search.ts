/**
 * TMDb search proxy.
 *
 * Hides the API key server-side. Used by the Tina movie-picker custom field.
 * Returns a slim, normalized result list.
 *
 *   GET /api/tmdb-search?q=Inception
 *
 * Response:
 *   { results: [{ id, title, year, posterUrl, overview }, ...] }
 */
import type { APIRoute } from "astro";

export const prerender = false;

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

type TmdbSearchResult = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
};

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.TMDB_API_KEY ?? process.env.TMDB_API_KEY;
  if (!apiKey) {
    return json({ error: "TMDB_API_KEY not configured" }, 500);
  }

  const q = url.searchParams.get("q")?.trim();
  if (!q) {
    return json({ results: [] });
  }

  const tmdbUrl = new URL(`${TMDB_BASE}/search/movie`);
  tmdbUrl.searchParams.set("api_key", apiKey);
  tmdbUrl.searchParams.set("query", q);
  tmdbUrl.searchParams.set("include_adult", "false");
  tmdbUrl.searchParams.set("language", "en-US");

  try {
    const r = await fetch(tmdbUrl.toString());
    if (!r.ok) {
      return json({ error: `TMDb ${r.status}` }, 502);
    }
    const data = (await r.json()) as { results?: TmdbSearchResult[] };
    const results = (data.results ?? []).slice(0, 10).map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : undefined,
      posterUrl: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : undefined,
      overview: m.overview,
    }));
    return json({ results });
  } catch (err) {
    return json({ error: String(err) }, 502);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Cache lightly so repeated typing doesn't hammer TMDb
      "cache-control": "public, max-age=60, s-maxage=300",
      // Allow same-origin /admin pages to fetch
      "access-control-allow-origin": "*",
    },
  });
};
