import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const { slug } = params;
  const page_type = url.searchParams.get("type");

  if (!slug || !page_type) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, content, created_at")
    .eq("page_slug", slug)
    .eq("page_type", page_type)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("comments fetch error:", error);
    return new Response(JSON.stringify([]), { status: 200 });
  }

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
