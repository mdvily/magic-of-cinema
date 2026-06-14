import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

const VALID_REACTIONS = ["thumbs_up", "heart", "popcorn", "mind_blown"];

export const GET: APIRoute = async ({ params, url }) => {
  const { slug } = params;
  const page_type = url.searchParams.get("type");

  if (!slug || !page_type) {
    return new Response(JSON.stringify({}), { status: 200 });
  }

  const { data } = await supabase
    .from("reactions")
    .select("reaction_type, count")
    .eq("page_slug", slug)
    .eq("page_type", page_type);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.reaction_type] = row.count;
  }

  return new Response(JSON.stringify(counts), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ params, url, request }) => {
  const { slug } = params;
  const page_type = url.searchParams.get("type");

  let body: { reaction_type?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { reaction_type } = body;

  if (!slug || !page_type || !reaction_type || !VALID_REACTIONS.includes(reaction_type)) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const { error } = await supabase.rpc("increment_reaction", {
    p_slug: slug,
    p_type: page_type,
    p_reaction: reaction_type,
  });

  if (error) {
    console.error("reaction increment error:", error);
    return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
