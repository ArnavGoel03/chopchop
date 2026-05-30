/**
 * tests/unit/payments.test.ts
 *
 * Unit tests for lib/payments/razorpay.ts
 *
 * Coverage:
 *  - verifyRazorpaySignature: valid, tampered, wrong ids, malformed/short (no throw)
 *  - verifyWebhookSignature: valid, tampered, missing secret
 *  - Secret unset → returns false, no throw
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

// ── Mock server-only so the module can be imported in Node/vitest env ─────────
vi.mock("server-only", () => ({}));

// Import after mocking server-only
const { verifyRazorpaySignature, verifyWebhookSignature } = await import(
  "@/lib/payments/razorpay"
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePaymentSig(
  orderId: string,
  paymentId: string,
  secret: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function makeWebhookSig(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

// ── verifyRazorpaySignature ───────────────────────────────────────────────────

describe("verifyRazorpaySignature", () => {
  const SECRET = "test_key_secret_abc123";
  const ORDER_ID = "order_EtE3oTi0YI3Lcy";
  const PAYMENT_ID = "pay_EtEwk0BFQmF3UW";

  beforeEach(() => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for a valid HMAC-SHA256 signature", () => {
    const sig = makePaymentSig(ORDER_ID, PAYMENT_ID, SECRET);
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, sig)).toBe(true);
  });

  it("returns false for a tampered signature (1 char flipped)", () => {
    const sig = makePaymentSig(ORDER_ID, PAYMENT_ID, SECRET);
    // Flip the last hex nibble
    const tampered = sig.slice(0, -1) + (sig.endsWith("f") ? "e" : "f");
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, tampered)).toBe(false);
  });

  it("returns false when orderId is wrong", () => {
    const sig = makePaymentSig(ORDER_ID, PAYMENT_ID, SECRET);
    expect(verifyRazorpaySignature("order_WRONG", PAYMENT_ID, sig)).toBe(false);
  });

  it("returns false when paymentId is wrong", () => {
    const sig = makePaymentSig(ORDER_ID, PAYMENT_ID, SECRET);
    expect(verifyRazorpaySignature(ORDER_ID, "pay_WRONG", sig)).toBe(false);
  });

  it("returns false for an all-zero (bogus) signature — no throw (regression: timingSafeEqual length guard)", () => {
    // All-zero hex is valid length (64 chars) but wrong value
    const bogus = "0".repeat(64);
    expect(() => verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, bogus)).not.toThrow();
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, bogus)).toBe(false);
  });

  it("returns false for a MALFORMED/short signature — no throw (regression: length-mismatch guard)", () => {
    // Short string — Buffer length != expected Buffer length, must not throw
    const short = "abc123";
    expect(() => verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, short)).not.toThrow();
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, short)).toBe(false);
  });

  it("returns false for empty string signature — no throw", () => {
    expect(() => verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, "")).not.toThrow();
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, "")).toBe(false);
  });

  it("returns false when RAZORPAY_KEY_SECRET is not set — no throw", () => {
    vi.unstubAllEnvs();
    // Ensure env var is missing
    const sig = makePaymentSig(ORDER_ID, PAYMENT_ID, SECRET);
    expect(() => verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, sig)).not.toThrow();
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, sig)).toBe(false);
  });

  it("returns false when signature built with wrong secret", () => {
    const sigWrongKey = makePaymentSig(ORDER_ID, PAYMENT_ID, "wrong_secret");
    expect(verifyRazorpaySignature(ORDER_ID, PAYMENT_ID, sigWrongKey)).toBe(false);
  });
});

// ── verifyWebhookSignature ────────────────────────────────────────────────────

describe("verifyWebhookSignature", () => {
  const WEBHOOK_SECRET = "whsec_test_abc456";
  const RAW_BODY = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_abc", order_id: "order_xyz" } } },
  });

  beforeEach(() => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for a valid webhook signature", () => {
    const sig = makeWebhookSig(RAW_BODY, WEBHOOK_SECRET);
    expect(verifyWebhookSignature(RAW_BODY, sig)).toBe(true);
  });

  it("returns false when body is tampered", () => {
    const sig = makeWebhookSig(RAW_BODY, WEBHOOK_SECRET);
    const tamperedBody = RAW_BODY + " ";
    expect(verifyWebhookSignature(tamperedBody, sig)).toBe(false);
  });

  it("returns false for a wrong signature", () => {
    const wrongSig = makeWebhookSig(RAW_BODY, "different_secret");
    expect(verifyWebhookSignature(RAW_BODY, wrongSig)).toBe(false);
  });

  it("returns false for malformed/short signature — no throw", () => {
    expect(() => verifyWebhookSignature(RAW_BODY, "short")).not.toThrow();
    expect(verifyWebhookSignature(RAW_BODY, "short")).toBe(false);
  });

  it("returns false when RAZORPAY_WEBHOOK_SECRET is not set — no throw", () => {
    vi.unstubAllEnvs();
    const sig = makeWebhookSig(RAW_BODY, WEBHOOK_SECRET);
    expect(() => verifyWebhookSignature(RAW_BODY, sig)).not.toThrow();
    expect(verifyWebhookSignature(RAW_BODY, sig)).toBe(false);
  });

  it("returns false for empty string signature — no throw", () => {
    expect(() => verifyWebhookSignature(RAW_BODY, "")).not.toThrow();
    expect(verifyWebhookSignature(RAW_BODY, "")).toBe(false);
  });
});
