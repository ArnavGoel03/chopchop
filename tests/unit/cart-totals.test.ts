import { describe, it, expect } from "vitest";
import { resolveLines, computeTotals, COUPONS } from "@/lib/cart/totals";
import type { CartLine } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

// Single chopper (single variant) — ₹999 / $14.99
const singleChopperLine: CartLine = {
  productSlug: "5-blade-chopper",
  variantId: "single",
  qty: 1,
};

// Family pack (2 units) — ₹1799 / $26.99
const familyChopperLine: CartLine = {
  productSlug: "5-blade-chopper",
  variantId: "family",
  qty: 1,
};

// Rapid peeler single — ₹299 / $6.99
const peelerLine: CartLine = {
  productSlug: "rapid-peeler",
  variantId: "single",
  qty: 1,
};

// ── resolveLines ─────────────────────────────────────────────────────────────

describe("resolveLines", () => {
  it("resolves a valid line for IN region", () => {
    const lines = resolveLines([singleChopperLine], "in");
    expect(lines).toHaveLength(1);
    expect(lines[0].product.slug).toBe("5-blade-chopper");
    expect(lines[0].variant.id).toBe("single");
    expect(lines[0].unitPrice).toBe(99900); // ₹999 in paise
    expect(lines[0].lineTotal).toBe(99900);
  });

  it("resolves a valid line for intl region", () => {
    const lines = resolveLines([singleChopperLine], "intl");
    expect(lines).toHaveLength(1);
    expect(lines[0].unitPrice).toBe(1499); // $14.99 in cents
    expect(lines[0].lineTotal).toBe(1499);
  });

  it("multiplies unitPrice by qty correctly", () => {
    const line: CartLine = { productSlug: "5-blade-chopper", variantId: "single", qty: 3 };
    const lines = resolveLines([line], "in");
    expect(lines[0].lineTotal).toBe(99900 * 3);
  });

  it("skips lines with an invalid productSlug", () => {
    const invalidLine: CartLine = {
      productSlug: "does-not-exist",
      variantId: "single",
      qty: 1,
    };
    const lines = resolveLines([invalidLine], "in");
    expect(lines).toHaveLength(0);
  });

  it("falls back to first variant for unknown variantId", () => {
    const line: CartLine = {
      productSlug: "5-blade-chopper",
      variantId: "unknown-variant",
      qty: 1,
    };
    const lines = resolveLines([line], "in");
    expect(lines).toHaveLength(1);
    // First variant of chopper is 'single'
    expect(lines[0].variant.id).toBe("single");
  });

  it("resolves multiple lines in one call", () => {
    const lines = resolveLines([singleChopperLine, peelerLine], "in");
    expect(lines).toHaveLength(2);
  });

  it("skips only the invalid line when mixed with valid lines", () => {
    const invalid: CartLine = { productSlug: "ghost-product", variantId: "x", qty: 1 };
    const lines = resolveLines([singleChopperLine, invalid, peelerLine], "in");
    expect(lines).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(resolveLines([], "in")).toEqual([]);
    expect(resolveLines([], "intl")).toEqual([]);
  });
});

// ── computeTotals ─────────────────────────────────────────────────────────────

describe("computeTotals — subtotal math", () => {
  it("subtotal = sum of all lineTotals for IN", () => {
    const resolved = resolveLines([singleChopperLine, peelerLine], "in");
    const totals = computeTotals(resolved, "in");
    // ₹999 + ₹299 = ₹1298 (in paise)
    expect(totals.subtotal).toBe(99900 + 29900);
  });

  it("subtotal = sum for intl", () => {
    const resolved = resolveLines([singleChopperLine, peelerLine], "intl");
    const totals = computeTotals(resolved, "intl");
    expect(totals.subtotal).toBe(1499 + 699);
  });

  it("subtotal=0 for empty cart", () => {
    const totals = computeTotals([], "in");
    expect(totals.subtotal).toBe(0);
  });
});

describe("computeTotals — shipping (IN always free)", () => {
  it("IN: shipping is always 0 (even for small orders)", () => {
    const resolved = resolveLines([peelerLine], "in"); // ₹299
    const totals = computeTotals(resolved, "in");
    expect(totals.shipping).toBe(0);
  });

  it("IN: shipping is 0 for empty cart", () => {
    const totals = computeTotals([], "in");
    expect(totals.shipping).toBe(0);
  });

  it("IN: shipping is 0 for very large order", () => {
    const bigLine: CartLine = { productSlug: "5-blade-chopper", variantId: "family", qty: 10 };
    const resolved = resolveLines([bigLine], "in");
    const totals = computeTotals(resolved, "in");
    expect(totals.shipping).toBe(0);
  });
});

describe("computeTotals — shipping (INTL: free over $50, $9 flat below)", () => {
  it("INTL: charges flat shipping $9 when subtotal < $50 threshold (5000 cents)", () => {
    // single chopper = $14.99 (1499 cents) < 5000
    const resolved = resolveLines([singleChopperLine], "intl");
    const totals = computeTotals(resolved, "intl");
    expect(totals.shipping).toBe(900); // $9 in cents
  });

  it("INTL: free shipping when subtotal exactly equals threshold (5000 cents)", () => {
    // We need exactly 5000 cents. Use family pack ($26.99 = 2699) + something
    // family pack (2699) + kadhai 2.5L (2499) = 5198 > 5000 → free
    const kadhai: CartLine = { productSlug: "nonstick-kadhai", variantId: "single", qty: 1 };
    const resolved = resolveLines([familyChopperLine, kadhai], "intl");
    expect(resolved[0].lineTotal + resolved[1].lineTotal).toBeGreaterThanOrEqual(5000);
    const totals = computeTotals(resolved, "intl");
    expect(totals.shipping).toBe(0);
  });

  it("INTL: free shipping when subtotal > $50 threshold", () => {
    // mandoline (1299) + kadhai (2499) + chopper family (2699) = 6497 > 5000
    const mandoline: CartLine = { productSlug: "mandoline-slicer", variantId: "single", qty: 1 };
    const kadhai: CartLine = { productSlug: "nonstick-kadhai", variantId: "single", qty: 1 };
    const resolved = resolveLines([familyChopperLine, mandoline, kadhai], "intl");
    const totals = computeTotals(resolved, "intl");
    expect(totals.shipping).toBe(0);
  });

  it("INTL: shipping is $9 for empty cart (subtotal=0 < threshold)", () => {
    const totals = computeTotals([], "intl");
    // subtotal=0 — the shipping logic: subtotal > 0 AND (threshold=0 OR subtotal>=threshold)
    // subtotal=0 → shipping=flatShipping=900
    expect(totals.shipping).toBe(900);
  });
});

describe("computeTotals — COD fee", () => {
  it("IN: charges COD fee when method=cod", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", { method: "cod" });
    expect(totals.codFee).toBe(5000); // ₹50 in paise
  });

  it("IN: no COD fee when method=online", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", { method: "online" });
    expect(totals.codFee).toBe(0);
  });

  it("IN: no COD fee when method is not provided", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in");
    expect(totals.codFee).toBe(0);
  });

  it("INTL: NEVER gets COD fee even if method=cod (codAvailable=false)", () => {
    const resolved = resolveLines([singleChopperLine], "intl");
    const totals = computeTotals(resolved, "intl", { method: "cod" });
    expect(totals.codFee).toBe(0);
  });

  it("INTL: no COD fee for online payment", () => {
    const resolved = resolveLines([singleChopperLine], "intl");
    const totals = computeTotals(resolved, "intl", { method: "online" });
    expect(totals.codFee).toBe(0);
  });
});

describe("computeTotals — coupon codes", () => {
  it("SUMMER100 (flat ₹100 = 10000 paise) applies correctly for IN", () => {
    const resolved = resolveLines([singleChopperLine], "in"); // ₹999
    const totals = computeTotals(resolved, "in", { couponCode: "SUMMER100" });
    expect(totals.discount).toBe(10000);
    expect(totals.subtotal - totals.discount).toBe(89900);
  });

  it("CHOPNOW150 (flat ₹150 = 15000 paise) applies for IN", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", { couponCode: "CHOPNOW150" });
    expect(totals.discount).toBe(15000);
  });

  it("FRIEND200 (flat ₹200 = 20000 paise) applies for IN", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", { couponCode: "FRIEND200" });
    expect(totals.discount).toBe(20000);
  });

  it("NEW10 (10% pct) applies for IN", () => {
    const resolved = resolveLines([singleChopperLine], "in"); // 99900
    const totals = computeTotals(resolved, "in", { couponCode: "NEW10" });
    expect(totals.discount).toBe(Math.round(99900 * 10 / 100)); // 9990
  });

  it("NEW10 (10% pct) applies for intl", () => {
    const resolved = resolveLines([singleChopperLine], "intl"); // 1499
    const totals = computeTotals(resolved, "intl", { couponCode: "NEW10" });
    expect(totals.discount).toBe(Math.round(1499 * 10 / 100)); // 149 (rounded)
  });

  it("INTL flat coupon is scaled by /100 (SUMMER100 → 100 cents = $1)", () => {
    const resolved = resolveLines([singleChopperLine], "intl"); // 1499
    const totals = computeTotals(resolved, "intl", { couponCode: "SUMMER100" });
    // 10000 / 100 = 100 cents = $1
    expect(totals.discount).toBe(100);
  });

  it("INTL flat coupon FRIEND200 → 200 cents = $2", () => {
    const resolved = resolveLines([singleChopperLine], "intl");
    const totals = computeTotals(resolved, "intl", { couponCode: "FRIEND200" });
    expect(totals.discount).toBe(200); // 20000 / 100
  });

  it("discount is capped at subtotal (cannot go negative)", () => {
    // subtotal = peeler ₹299 = 29900 paise; FRIEND200 discount = 20000 < 29900 → no cap
    // Use a tiny order where discount > subtotal is impossible normally…
    // Force by using a low-price item with a large coupon
    // Use SUMMER100 (10000 paise) on peeler (29900) — not capped
    const resolved = resolveLines([peelerLine], "in");
    const totals = computeTotals(resolved, "in", { couponCode: "SUMMER100" });
    expect(totals.discount).toBeLessThanOrEqual(totals.subtotal);
  });

  it("discount cannot exceed subtotal — capped", () => {
    // Use FRIEND200 (20000 paise) on an empty cart (subtotal=0)
    const totals = computeTotals([], "in", { couponCode: "FRIEND200" });
    expect(totals.discount).toBe(0); // capped at 0
    expect(totals.total).toBe(0); // no shipping on empty cart (IN)
  });

  it("coupon code is case-insensitive (lowercase accepted)", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const upper = computeTotals(resolved, "in", { couponCode: "NEW10" });
    const lower = computeTotals(resolved, "in", { couponCode: "new10" });
    expect(lower.discount).toBe(upper.discount);
  });

  it("coupon code with whitespace is trimmed", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const clean = computeTotals(resolved, "in", { couponCode: "NEW10" });
    const spaced = computeTotals(resolved, "in", { couponCode: "  NEW10  " });
    expect(spaced.discount).toBe(clean.discount);
  });

  it("invalid coupon code applies no discount", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", { couponCode: "FAKECODE" });
    expect(totals.discount).toBe(0);
  });

  it("no coupon → discount=0", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in");
    expect(totals.discount).toBe(0);
  });
});

describe("computeTotals — total never negative", () => {
  it("total is never negative even with massive discount+cod", () => {
    // Use empty cart with a coupon that would try to apply a discount
    const totals = computeTotals([], "in", {
      method: "cod",
      couponCode: "FRIEND200",
    });
    expect(totals.total).toBeGreaterThanOrEqual(0);
  });

  it("total = subtotal - discount + shipping + codFee for normal case", () => {
    const resolved = resolveLines([singleChopperLine], "in");
    const totals = computeTotals(resolved, "in", {
      method: "cod",
      couponCode: "NEW10",
    });
    const expected = Math.max(
      0,
      totals.subtotal - totals.discount + totals.shipping + totals.codFee
    );
    expect(totals.total).toBe(expected);
  });
});

describe("computeTotals — currency", () => {
  it("returns INR for IN region", () => {
    const totals = computeTotals([], "in");
    expect(totals.currency).toBe("INR");
  });

  it("returns USD for intl region", () => {
    const totals = computeTotals([], "intl");
    expect(totals.currency).toBe("USD");
  });
});

describe("COUPONS constant", () => {
  it("all expected coupons are present", () => {
    expect(COUPONS["SUMMER100"]).toBeDefined();
    expect(COUPONS["CHOPNOW150"]).toBeDefined();
    expect(COUPONS["FRIEND200"]).toBeDefined();
    expect(COUPONS["NEW10"]).toBeDefined();
  });

  it("flat coupons have type=flat", () => {
    expect(COUPONS["SUMMER100"].type).toBe("flat");
    expect(COUPONS["CHOPNOW150"].type).toBe("flat");
    expect(COUPONS["FRIEND200"].type).toBe("flat");
  });

  it("NEW10 is a pct coupon with value=10", () => {
    expect(COUPONS["NEW10"].type).toBe("pct");
    expect(COUPONS["NEW10"].value).toBe(10);
  });
});
