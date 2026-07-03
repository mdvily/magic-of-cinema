import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token) return false;
  const { error } = await supabase
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("token", token);
  return !error;
}

// Visible unsubscribe link in the email — user clicks, lands on confirmation page.
export const GET: APIRoute = async ({ url }) => {
  const ok = await unsubscribe(url.searchParams.get("token"));
  if (!ok) return new Response("Failed to unsubscribe", { status: 400 });
  return Response.redirect(new URL("/unsubscribe?done=1", url.origin));
};

// One-click unsubscribe (RFC 8058) — mail clients POST here automatically.
export const POST: APIRoute = async ({ url }) => {
  const ok = await unsubscribe(url.searchParams.get("token"));
  return new Response(ok ? "Unsubscribed" : "Failed", { status: ok ? 200 : 400 });
};
