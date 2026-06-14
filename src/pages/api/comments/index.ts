import type { APIRoute } from "astro";
import { createHmac } from "crypto";
import { supabase } from "../../../lib/supabase";
import { transporter } from "../../../lib/mailer";

export const prerender = false;

function makeToken(id: string, action: string) {
  return createHmac("sha256", import.meta.env.COMMENT_APPROVE_SECRET)
    .update(`${id}:${action}`)
    .digest("hex");
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // Honeypot — bots fill this, humans don't
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const { page_slug, page_type, author_name, content } = body;

  if (!content?.trim() || !page_slug || !page_type) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }
  if (content.trim().length > 2000) {
    return new Response(JSON.stringify({ error: "Comment too long (max 2000 chars)" }), { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      page_slug,
      page_type,
      author_name: author_name?.trim() || null,
      content: content.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("comment insert error:", error);
    return new Response(JSON.stringify({ error: "Failed to save comment" }), { status: 500 });
  }

  const base = "https://magic-of-cinema.vercel.app";
  const approveUrl = `${base}/api/comments/approve?id=${data.id}&action=approve&token=${makeToken(data.id, "approve")}`;
  const rejectUrl = `${base}/api/comments/approve?id=${data.id}&action=reject&token=${makeToken(data.id, "reject")}`;
  const displayName = author_name?.trim() || "Anonymous";

  try {
    await transporter.sendMail({
      from: import.meta.env.GMAIL_USER,
      to: import.meta.env.GMAIL_USER,
      subject: `💬 New comment on ${page_type}/${page_slug}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#b91c1c">New comment on Magic of Cinema</h2>
          <p><strong>Page:</strong> ${page_type} / ${page_slug}</p>
          <p><strong>From:</strong> ${displayName}</p>
          <blockquote style="border-left:4px solid #b91c1c;margin:12px 0;padding:8px 16px;background:#fdf8ee;color:#1c1917">
            ${content.trim().replace(/\n/g, "<br>")}
          </blockquote>
          <p style="margin-top:20px">
            <a href="${approveUrl}"
               style="background:#16a34a;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;margin-right:12px;font-weight:bold">
              ✅ Approve
            </a>
            <a href="${rejectUrl}"
               style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold">
              ❌ Reject
            </a>
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("email send error:", emailErr);
    // Comment is saved even if email fails — don't 500 the user
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
