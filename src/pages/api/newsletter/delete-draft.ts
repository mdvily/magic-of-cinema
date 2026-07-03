import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { newsletterId?: string };
  try { body = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }

  if (!body.newsletterId) return new Response("newsletterId required", { status: 400 });

  await supabase.from("newsletters").delete().eq("id", body.newsletterId).eq("status", "draft");

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
};
