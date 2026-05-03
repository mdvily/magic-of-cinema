/**
 * Vercel deploy notification webhook.
 *
 * Configure in Vercel: Project Settings → Deployment Notifications → Webhook.
 * Vercel POSTs JSON describing the deployment; we forward a Telegram message
 * to Mike's bot.
 *
 * Auth: shared secret in `?secret=...` query param (env: NOTIFY_SECRET).
 *
 * Telegram credentials:
 *   - TELEGRAM_BOT_TOKEN
 *   - TELEGRAM_CHAT_ID  (numeric user id, e.g. "8631789252")
 *
 * If creds aren't set, the endpoint logs and returns 200 (so Vercel doesn't
 * keep retrying).
 */
import type { APIRoute } from "astro";

export const prerender = false;

type VercelHookPayload = {
  type?: string; // e.g. "deployment.succeeded", "deployment.error"
  payload?: {
    deployment?: {
      url?: string;
      meta?: {
        githubCommitMessage?: string;
        githubCommitAuthorName?: string;
      };
      target?: string; // "production" | "staging"
    };
    project?: { name?: string };
    url?: string;
    name?: string;
  };
  // Modern Vercel format
  url?: string;
  deployment?: { url?: string; target?: string };
};

export const POST: APIRoute = async ({ request, url }) => {
  const expected = import.meta.env.NOTIFY_SECRET ?? process.env.NOTIFY_SECRET;
  if (expected) {
    const got = url.searchParams.get("secret");
    if (got !== expected) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let body: VercelHookPayload = {};
  try {
    body = (await request.json()) as VercelHookPayload;
  } catch {
    /* ignore: empty body still 200 */
  }

  const eventType = body.type ?? "deployment.unknown";
  // Only fire on successful production deploys
  const isSuccess = eventType === "deployment.succeeded" || eventType === "deployment-ready";
  const target =
    body.deployment?.target ?? body.payload?.deployment?.target ?? "production";

  if (!isSuccess || target !== "production") {
    return new Response("ok (skipped)", { status: 200 });
  }

  const deployUrl =
    body.deployment?.url ??
    body.payload?.deployment?.url ??
    body.payload?.url ??
    body.url;
  const commitMsg = body.payload?.deployment?.meta?.githubCommitMessage;
  const author = body.payload?.deployment?.meta?.githubCommitAuthorName;

  const botToken =
    import.meta.env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatId =
    import.meta.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("notify-deploy: telegram creds missing, skipping");
    return new Response("ok (creds missing)", { status: 200 });
  }

  const lines = [
    "🎬 <b>Magic of Cinema deployed</b>",
    deployUrl ? `🔗 https://${deployUrl}` : null,
    commitMsg ? `📝 ${escapeHtml(truncate(commitMsg, 200))}` : null,
    author ? `👤 ${escapeHtml(author)}` : null,
    `🌐 https://magic-of-cinema.vercel.app`,
  ].filter(Boolean);

  const text = lines.join("\n");

  try {
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(tgUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!resp.ok) {
      console.warn("notify-deploy: telegram", resp.status, await resp.text());
    }
  } catch (e) {
    console.warn("notify-deploy: fetch failed", e);
  }

  return new Response("ok", { status: 200 });
};

// Allow GET pings for setup verification
export const GET: APIRoute = async () => {
  return new Response("notify-deploy endpoint live. POST from Vercel webhook.", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
};

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
