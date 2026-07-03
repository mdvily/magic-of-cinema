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

  let body: { requestId?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { requestId, status } = body;
  const allowed = ["active", "picked", "reviewed"];

  if (!requestId || !status || !allowed.includes(status)) {
    return json({ error: "requestId and status (active|picked|reviewed) required" }, 400);
  }

  const { error } = await supabase
    .from("movie_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    return json({ error: "Failed to update status" }, 500);
  }

  return json({ ok: true });
};
