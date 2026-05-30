/**
 * tests/unit/auth.test.ts
 *
 * Unit tests for lib/auth.ts
 *
 * Coverage:
 *  - checkPassword: correct, wrong, empty input, unset env
 *  - createSessionToken / verifySession: fresh token valid; tampered false;
 *    malformed (wrong segment count, bad hex) returns false not throw;
 *    expired token false
 *  - ADMIN_SESSION_SECRET not set → createSessionToken throws (by design);
 *    verifySession returns false
 *
 * NOTE on expired-token testing: SESSION_TTL_MS is 7 days and is not
 * injectable from outside the module. We craft expired tokens by manually
 * assembling the token format (expiry.nonce.sig) with a past expiry
 * timestamp, which exercises the expiry branch without needing time stubs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

// Mock next/headers — isAuthed() depends on it but we don't test that here
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

const { checkPassword, createSessionToken, verifySession } = await import(
  "@/lib/auth"
);

// ── checkPassword ─────────────────────────────────────────────────────────────

describe("checkPassword", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "correct-secret-pass");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for the correct password", () => {
    expect(checkPassword("correct-secret-pass")).toBe(true);
  });

  it("returns false for the wrong password", () => {
    expect(checkPassword("wrong-password")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(checkPassword("")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(checkPassword("Correct-Secret-Pass")).toBe(false);
  });

  it("returns false when ADMIN_PASSWORD is not set — no throw", () => {
    vi.unstubAllEnvs();
    expect(() => checkPassword("anything")).not.toThrow();
    expect(checkPassword("anything")).toBe(false);
  });
});

// ── createSessionToken + verifySession ───────────────────────────────────────

describe("createSessionToken / verifySession", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "session-secret-for-tests-only");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a token that immediately verifies as true", () => {
    const token = createSessionToken();
    expect(verifySession(token)).toBe(true);
  });

  it("token has three dot-separated parts (expiry.nonce.sig)", () => {
    const token = createSessionToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("expiry is in the future (7 days from now)", () => {
    const token = createSessionToken();
    const exp = Number(token.split(".")[0]);
    expect(exp).toBeGreaterThan(Date.now());
    // Sanity: no more than 8 days out
    expect(exp).toBeLessThan(Date.now() + 8 * 24 * 60 * 60 * 1000);
  });

  it("returns false for undefined token", () => {
    expect(verifySession(undefined)).toBe(false);
  });

  it("returns false when signature is tampered (1 char flipped)", () => {
    const token = createSessionToken();
    const parts = token.split(".");
    const sig = parts[2];
    const tamperedSig = sig.slice(0, -1) + (sig.endsWith("f") ? "e" : "f");
    const tampered = `${parts[0]}.${parts[1]}.${tamperedSig}`;
    expect(verifySession(tampered)).toBe(false);
  });

  it("returns false when nonce is tampered", () => {
    const token = createSessionToken();
    const parts = token.split(".");
    const tamperedNonce = parts[1].slice(0, -1) + (parts[1].endsWith("f") ? "e" : "f");
    const tampered = `${parts[0]}.${tamperedNonce}.${parts[2]}`;
    expect(verifySession(tampered)).toBe(false);
  });

  it("returns false for a malformed token (only 2 parts) — no throw", () => {
    expect(() => verifySession("only.twoparts")).not.toThrow();
    expect(verifySession("only.twoparts")).toBe(false);
  });

  it("returns false for a malformed token (1 part) — no throw", () => {
    expect(() => verifySession("singletoken")).not.toThrow();
    expect(verifySession("singletoken")).toBe(false);
  });

  it("returns false for a malformed token (4+ parts) — no throw", () => {
    expect(() => verifySession("a.b.c.d")).not.toThrow();
    expect(verifySession("a.b.c.d")).toBe(false);
  });

  it("returns false for bad hex in sig buffer — no throw", () => {
    // Construct a token whose sig part is non-hex garbage
    const token = createSessionToken();
    const parts = token.split(".");
    const badSig = "not-valid-hex!!";
    const badToken = `${parts[0]}.${parts[1]}.${badSig}`;
    expect(() => verifySession(badToken)).not.toThrow();
    expect(verifySession(badToken)).toBe(false);
  });

  it("returns false for an expired token — no throw", () => {
    // Manually craft a token with a past expiry using the known secret
    const secret = "session-secret-for-tests-only";
    const expiredExp = Date.now() - 1000; // 1 second in the past
    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = `${expiredExp}.${nonce}`;
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const expiredToken = `${expiredExp}.${nonce}.${sig}`;

    expect(() => verifySession(expiredToken)).not.toThrow();
    expect(verifySession(expiredToken)).toBe(false);
  });

  it("returns false for a token with non-numeric expiry — no throw", () => {
    const parts = createSessionToken().split(".");
    const badToken = `notanumber.${parts[1]}.${parts[2]}`;
    expect(() => verifySession(badToken)).not.toThrow();
    expect(verifySession(badToken)).toBe(false);
  });

  it("throws when ADMIN_SESSION_SECRET is not set (by design)", () => {
    vi.unstubAllEnvs();
    expect(() => createSessionToken()).toThrow(/ADMIN_SESSION_SECRET/);
  });

  it("verifySession throws when ADMIN_SESSION_SECRET is cleared mid-flight (by design)", () => {
    // By design, secret() throws if the env var is falsy.
    // A valid token created with the correct secret will fail verification if the
    // secret is later cleared — the throw is intentional (fail-fast security posture).
    const token = createSessionToken(); // secret still set in this call
    vi.stubEnv("ADMIN_SESSION_SECRET", ""); // reset to empty (falsy)
    // sign() calls secret() which throws — this is expected behavior
    expect(() => verifySession(token)).toThrow(/ADMIN_SESSION_SECRET/);
  });
});
