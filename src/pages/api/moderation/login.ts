import type { APIRoute } from "astro";
import { timingSafeEqual } from "crypto";
import { createSessionCookie } from "../../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const password = form.get("password")?.toString() ?? "";
  const mod = import.meta.env.MOD_PASSWORD ?? "";

  let match = false;
  try {
    if (password.length === mod.length && mod.length > 0) {
      match = timingSafeEqual(Buffer.from(password), Buffer.from(mod));
    }
  } catch {}

  if (!match) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/moderation/login?error=1" },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      "Set-Cookie": createSessionCookie(),
      Location: "/moderation",
    },
  });
};
