import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const { error } = await supabase
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("token", token);

  if (error) {
    return new Response("Failed to unsubscribe", { status: 500 });
  }

  return Response.redirect(new URL("/unsubscribe?done=1", url.origin));
};
