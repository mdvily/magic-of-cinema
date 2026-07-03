import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { requestId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.requestId) {
    return json({ error: "requestId required" }, 400);
  }

  // Delete votes first, then the request
  await supabase.from("request_votes").delete().eq("request_id", body.requestId);

  const { error } = await supabase
    .from("movie_requests")
    .delete()
    .eq("id", body.requestId);

  if (error) {
    return json({ error: "Failed to delete" }, 500);
  }

  return json({ ok: true });
};
