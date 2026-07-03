import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  return new Response(JSON.stringify({ count: count ?? 0 }), {
    headers: { "content-type": "application/json" },
  });
};
