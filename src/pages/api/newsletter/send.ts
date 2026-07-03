import type { APIRoute } from "astro";
import { marked } from "marked";
import { validateSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { resend, FROM, SITE } from "../../../lib/resend";
import { wrapEmailHtml } from "../../../lib/email-template";

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!validateSession(request.headers.get("cookie"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { newsletterId?: string; subject?: string; body_md?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.newsletterId) {
    return json({ error: "newsletterId required" }, 400);
  }

  // Load newsletter
  const { data: newsletter } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", body.newsletterId)
    .single();

  if (!newsletter) return json({ error: "Newsletter not found" }, 404);
  if (newsletter.status === "sent") return json({ error: "Already sent" }, 409);

  // Use edited content if provided
  const subject = body.subject?.trim() || newsletter.subject;
  const body_md = body.body_md?.trim() || newsletter.body_md;

  // Save edits back
  await supabase
    .from("newsletters")
    .update({ subject, body_md })
    .eq("id", newsletter.id);

  // Get active subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email, token")
    .eq("status", "active");

  if (!subscribers?.length) {
    return json({ error: "No active subscribers" }, 400);
  }

  // Render markdown to HTML
  const bodyHtml = await marked.parse(body_md);

  // Build per-subscriber emails
  const emails = subscribers.map((sub) => ({
    from: FROM,
    to: sub.email,
    subject,
    html: wrapEmailHtml(bodyHtml, sub.token),
    headers: {
      "List-Unsubscribe": `<${SITE}/api/newsletter/unsubscribe?token=${sub.token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }));

  // Resend batch limit is 100 — chunk if needed
  const CHUNK = 100;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const { error } = await resend.batch.send(emails.slice(i, i + CHUNK));
    if (error) {
      console.error("Resend batch error:", error);
      return json({ error: "Send failed", detail: error }, 500);
    }
  }

  // Mark as sent
  await supabase
    .from("newsletters")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", newsletter.id);

  return json({ ok: true, sent: subscribers.length });
};
