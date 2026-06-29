import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "mod_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(ts: string): string {
  return createHmac("sha256", import.meta.env.MOD_PASSWORD)
    .update(ts)
    .digest("hex");
}

export function createSessionCookie(): string {
  const ts = Date.now().toString();
  const sig = sign(ts);
  return `${COOKIE_NAME}=${ts}.${sig}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

export function validateSession(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const dot = match[1].indexOf(".");
  if (dot === -1) return false;
  const ts = match[1].slice(0, dot);
  const sig = match[1].slice(dot + 1);
  const expected = sign(ts);
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;
  } catch {
    return false;
  }
  return Date.now() - parseInt(ts, 10) < MAX_AGE_MS;
}
