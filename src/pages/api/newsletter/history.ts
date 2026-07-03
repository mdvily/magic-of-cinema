import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data } = await supabase
    .from("newsletters")
    .select("id, subject, body_md, status, created_at, sent_at")
    .order("created_at", { ascending: false });

  return new Response(JSON.stringify(data ?? []), {
    headers: { "content-type": "application/json" },
  });
};
