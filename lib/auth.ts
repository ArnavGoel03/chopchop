/**
 * Admin session auth — HMAC-SHA256 signed cookie, no external deps.
 * Uses node:crypto only; runtime must be "nodejs".
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "chop_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Produce a session token: `<expiry_ms>.<random_nonce>.<sig>` */
export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

/** Verify a session token — constant-time sig compare + expiry check. */
export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  // format: expiry . nonce . sig  → 3 dot-separated parts
  if (parts.length !== 3) return false;
  const [expStr, nonce, providedSig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${expStr}.${nonce}`;
  const expectedSig = sign(payload);
  // Pad both to the same byte length for constant-time compare
  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Timing-safe password check against ADMIN_PASSWORD env var. */
export function checkPassword(input: string): boolean {
  const stored = process.env.ADMIN_PASSWORD;
  if (!stored) return false;
  // Ensure both buffers have the same length to avoid timing leaks from
  // Buffer length mismatches — pad shorter string to the longer.
  const a = Buffer.from(input.padEnd(Math.max(input.length, stored.length)));
  const b = Buffer.from(stored.padEnd(Math.max(input.length, stored.length)));
  return timingSafeEqual(a, b);
}

/** Set the session cookie on the response. Call from a Route Handler. */
export function createSession(): { name: string; value: string; options: object } {
  const token = createSessionToken();
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

/** Clear the session cookie — returns the same shape for Route Handlers. */
export function clearSession(): { name: string; value: string; options: object } {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  };
}

/** Server-component helper — reads the Next 16 cookie store and verifies. */
export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifySession(token);
}
