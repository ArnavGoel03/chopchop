/**
 * POST /api/admin/login
 *   body: { password: string }  → 200 { ok: true } + sets session cookie
 *   body: { logout: true }      → 200 { ok: true } + clears session cookie
 * on bad password: 401
 *
 * Simple in-memory rate-limit: 5 attempts per IP per 15-minute window.
 * (Resets on server restart — sufficient for a low-traffic admin route.)
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSession, clearSession } from "@/lib/auth";

// ── rate-limit ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const attempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  record.count++;
  return record.count > RATE_LIMIT;
}

function resetAttempts(ip: string) {
  attempts.delete(ip);
}

// ── handlers ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Logout shortcut
  if (body.logout === true) {
    const s = clearSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(s.name, s.value, s.options as Parameters<typeof res.cookies.set>[2]);
    return res;
  }

  // Rate-limit before any password work
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts — try again later" },
      { status: 429 },
    );
  }

  const { password } = body as { password?: string };
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  resetAttempts(ip);
  const s = createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(s.name, s.value, s.options as Parameters<typeof res.cookies.set>[2]);
  return res;
}

// DELETE /api/admin/login — alternative logout verb
export async function DELETE() {
  const s = clearSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(s.name, s.value, s.options as Parameters<typeof res.cookies.set>[2]);
  return res;
}
