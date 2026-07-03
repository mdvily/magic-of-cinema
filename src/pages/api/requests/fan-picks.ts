import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const { data } = await supabase
    .from("movie_requests")
    .select("tmdb_id")
    .in("status", ["picked", "reviewed"]);

  return new Response(
    JSON.stringify({ tmdbIds: (data ?? []).map((r) => r.tmdb_id) }),
    { headers: { "content-type": "application/json" } }
  );
};
