import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { requestId?: string; vote?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { requestId, vote } = body;

  if (!requestId || (vote !== 1 && vote !== -1)) {
    return json({ error: "requestId and vote (1 or -1) required" }, 400);
  }

  // Verify request exists
  const { data: req } = await supabase
    .from("movie_requests")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) {
    return json({ error: "Request not found" }, 404);
  }

  const { error } = await supabase
    .from("request_votes")
    .insert({ request_id: requestId, vote });

  if (error) {
    return json({ error: "Failed to record vote" }, 500);
  }

  // Return updated total
  const { data: votes } = await supabase
    .from("request_votes")
    .select("vote")
    .eq("request_id", requestId);

  const total = (votes ?? []).reduce((sum, v) => sum + v.vote, 0);

  return json({ ok: true, voteTotal: total });
};
