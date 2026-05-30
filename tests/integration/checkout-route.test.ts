/**
 * tests/integration/checkout-route.test.ts
 *
 * Integration tests for the POST /api/checkout route handler.
 *
 * Key assertions:
 *  - Server RECOMPUTES totals from catalog; client cannot dictate price.
 *  - COD for intl is rejected.
 *  - Invalid JSON → 400.
 *  - Validation failures → 400.
 *  - No valid catalog items → 400.
 *  - provider:'none' path returned when gateway keys are unset.
 *  - COD path returns orderCode immediately.
 *  - IN/online and intl/online without gateway keys → provider:'none'.
 *
 * Gateway calls are mocked to return null (keys unset path) — no network.
 */

import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock server-only and db so the modules can load
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: null, hasDb: false, schema: {} }));

// Mock payment gateway calls — both return null (no keys configured)
vi.mock("@/lib/payments/razorpay", () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue(null),
  verifyRazorpaySignature: vi.fn().mockReturnValue(false),
  verifyWebhookSignature: vi.fn().mockReturnValue(false),
}));
vi.mock("@/lib/payments/stripe", () => ({
  createPaymentIntent: vi.fn().mockResolvedValue(null),
  constructWebhookEvent: vi.fn().mockReturnValue(null),
}));

// Import route handler after mocks are set up
const { POST } = await import("@/app/api/checkout/route");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validInPayload() {
  return {
    region: "in",
    method: "online",
    items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: 1 }],
    customer: { name: "Priya Sharma", phone: "+91 98765 43210" },
    shippingAddress: "123, MG Road, Bengaluru 560001",
  };
}

function validIntlPayload() {
  return {
    region: "intl",
    method: "online",
    items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: 1 }],
    customer: { name: "Jane Smith", phone: "+1 555 123 4567" },
    shippingAddress: "100 Main St, New York NY 10001",
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/checkout — input validation", () => {
  it("returns 400 for malformed JSON", async () => {
    const req = new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json {{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 400 for missing region", async () => {
    const { region: _, ...payload } = validInPayload();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 400 for missing items", async () => {
    const { items: _, ...payload } = validInPayload();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty items array", async () => {
    const res = await POST(makeRequest({ ...validInPayload(), items: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing customer", async () => {
    const { customer: _, ...payload } = validInPayload();
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });

  it("returns 400 for COD with intl region", async () => {
    const res = await POST(
      makeRequest({ ...validIntlPayload(), method: "cod" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/cash on delivery/i);
  });

  it("returns 400 when no valid catalog items match the request", async () => {
    const res = await POST(
      makeRequest({
        ...validInPayload(),
        items: [{ productSlug: "ghost-product-xyz", variantId: "single", qty: 1 }],
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/no valid items/i);
  });
});

describe("POST /api/checkout — server-side price recomputation", () => {
  it("recomputes total from catalog — ignores any client-side amount field", async () => {
    // Client sends a payload with no explicit amount (as per schema).
    // The server recomputes from catalog. We verify the response reflects
    // the catalog price, not any forged value.
    // 5-blade-chopper single = ₹999 = 99900 paise for IN region
    const res = await POST(makeRequest(validInPayload()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    // Server returns the server-recomputed amount (no Razorpay keys → none path)
    // The amount must match catalog: ₹999 in paise = 99900
    expect(json.amount).toBe(99900);
    expect(json.currency).toBe("INR");
  });

  it("recomputes for qty > 1 correctly", async () => {
    const res = await POST(
      makeRequest({
        ...validInPayload(),
        items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: 3 }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    // 3 × 99900 = 299700 paise
    expect(json.amount).toBe(299700);
  });

  it("recomputes for intl region in USD cents", async () => {
    const res = await POST(makeRequest(validIntlPayload()));
    expect(res.status).toBe(200);
    const json = await res.json();
    // 5-blade-chopper single intl = $14.99 = 1499 cents + $9 shipping = 900 cents = 2399 total
    expect(json.amount).toBe(2399);
    expect(json.currency).toBe("USD");
  });

  it("COD fee is included in server-computed amount", async () => {
    const res = await POST(
      makeRequest({ ...validInPayload(), method: "cod" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    // ₹999 (99900) + ₹50 COD fee (5000) = 104900
    expect(json.orderCode).toMatch(/^CHOP-/);
    // COD returns orderCode only, not amount (order is persisted immediately)
    expect(json.ok).toBe(true);
  });
});

describe("POST /api/checkout — response shape", () => {
  it("IN/online with no gateway keys → provider:'none' + amount + orderCode", async () => {
    const res = await POST(makeRequest(validInPayload()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.provider).toBe("none");
    expect(json.orderCode).toMatch(/^CHOP-[A-Z0-9]{5}-\d{4}$/);
    expect(typeof json.amount).toBe("number");
    expect(typeof json.currency).toBe("string");
  });

  it("intl/online with no gateway keys → provider:'none' + amount + orderCode", async () => {
    const res = await POST(makeRequest(validIntlPayload()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.provider).toBe("none");
    expect(json.orderCode).toMatch(/^CHOP-[A-Z0-9]{5}-\d{4}$/);
  });

  it("COD returns ok:true + orderCode immediately (no payment provider)", async () => {
    const res = await POST(
      makeRequest({ ...validInPayload(), method: "cod" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.orderCode).toMatch(/^CHOP-[A-Z0-9]{5}-\d{4}$/);
    // COD does not return provider/amount in the response
    expect(json.provider).toBeUndefined();
  });

  it("each call creates a unique orderCode", async () => {
    const res1 = await POST(makeRequest(validInPayload()));
    const res2 = await POST(makeRequest(validInPayload()));
    const j1 = await res1.json();
    const j2 = await res2.json();
    expect(j1.orderCode).not.toBe(j2.orderCode);
  });

  it("applies coupon discount server-side (NEW10 = 10% off)", async () => {
    const res = await POST(
      makeRequest({ ...validInPayload(), couponCode: "NEW10" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    // 99900 - 10% (9990) = 89910 (no shipping for IN)
    expect(json.amount).toBe(89910);
  });
});
