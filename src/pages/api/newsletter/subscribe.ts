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
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Valid email required" }, 400);
  }

  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "active") {
      return json({ ok: true, already: true });
    }
    // Re-subscribe
    await supabase
      .from("subscribers")
      .update({ status: "active" })
      .eq("id", existing.id);
    return json({ ok: true });
  }

  const { error } = await supabase.from("subscribers").insert({ email });
  if (error) {
    return json({ error: "Failed to subscribe" }, 500);
  }

  return json({ ok: true }, 201);
};
