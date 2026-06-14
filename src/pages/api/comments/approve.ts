import type { APIRoute } from "astro";
import { createHmac } from "crypto";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

function makeToken(id: string, action: string) {
  return createHmac("sha256", import.meta.env.COMMENT_APPROVE_SECRET)
    .update(`${id}:${action}`)
    .digest("hex");
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");

  if (!id || !action || !token) {
    return new Response("Missing parameters.", { status: 400, headers: { "content-type": "text/plain" } });
  }
  if (action !== "approve" && action !== "reject") {
    return new Response("Invalid action.", { status: 400, headers: { "content-type": "text/plain" } });
  }

  const expected = makeToken(id, action);
  if (token !== expected) {
    return new Response("Invalid or expired token.", { status: 403, headers: { "content-type": "text/plain" } });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("approve update error:", error);
    return new Response("Failed to update comment.", { status: 500, headers: { "content-type": "text/plain" } });
  }

  const emoji = action === "approve" ? "✅" : "❌";
  return new Response(
    `${emoji} Comment ${status}. You can close this tab.`,
    { status: 200, headers: { "content-type": "text/plain" } }
  );
};
