import type { APIRoute } from "astro";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const unauthorized = () => json({ error: "Unauthorized" }, 401);

// PATCH: edit comment body
export const PATCH: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) return unauthorized();
  const { id, body } = await request.json();
  if (!id || !body?.trim()) return json({ error: "Missing id or body" }, 400);
  const { error } = await supabase
    .from("comments")
    .update({ body: body.trim() })
    .eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};

// DELETE: soft-delete (status → rejected)
export const DELETE: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) return unauthorized();
  const { id } = await request.json();
  if (!id) return json({ error: "Missing id" }, 400);
  const { error } = await supabase
    .from("comments")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};

// POST: approve / reject / restore
export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) return unauthorized();
  const { id, action } = await request.json();
  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    restore: "approved",
  };
  if (!id || !(action in statusMap)) return json({ error: "Invalid" }, 400);
  const { error } = await supabase
    .from("comments")
    .update({ status: statusMap[action] })
    .eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};
