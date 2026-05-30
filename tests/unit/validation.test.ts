/**
 * tests/unit/validation.test.ts
 *
 * Unit tests for lib/validation.ts
 *
 * Coverage:
 *  - checkoutSchema: valid payloads pass; required fields missing fail;
 *    shippingAddress as STRING accepted (regression: schema-mismatch fix);
 *    COD/online/region variants; optional fields are optional
 *  - verifySchema: valid razorpay verify body passes; missing fields fail
 */

import { describe, it, expect } from "vitest";
import { checkoutSchema, verifySchema } from "@/lib/validation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function validCheckoutPayload() {
  return {
    region: "in" as const,
    method: "online" as const,
    items: [
      {
        productSlug: "5-blade-chopper",
        variantId: "single",
        qty: 1,
      },
    ],
    customer: {
      name: "Priya Sharma",
      phone: "+91 98765 43210",
    },
    shippingAddress: "123, MG Road, Bengaluru, Karnataka 560001",
  };
}

// ── checkoutSchema — passing cases ───────────────────────────────────────────

describe("checkoutSchema — valid payloads", () => {
  it("accepts a minimal valid IN/online payload", () => {
    const result = checkoutSchema.safeParse(validCheckoutPayload());
    expect(result.success).toBe(true);
  });

  it("accepts COD method for IN region", () => {
    const payload = { ...validCheckoutPayload(), method: "cod" as const };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts intl region with online method", () => {
    const payload = { ...validCheckoutPayload(), region: "intl" as const };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts shippingAddress as a STRING (regression: not an object)", () => {
    // Critical regression test: shippingAddress must be a string, not an object
    const payload = {
      ...validCheckoutPayload(),
      shippingAddress: "Flat 5B, Green Valley Apts, Pune, 411001",
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.shippingAddress).toBe("string");
    }
  });

  it("accepts payload without optional shippingAddress", () => {
    const { shippingAddress: _omit, ...payload } = validCheckoutPayload();
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts optional email in customer object", () => {
    const payload = {
      ...validCheckoutPayload(),
      customer: {
        name: "Arjun Mehta",
        phone: "9876543210",
        email: "arjun@example.com",
      },
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customer.email).toBe("arjun@example.com");
    }
  });

  it("accepts optional couponCode", () => {
    const payload = { ...validCheckoutPayload(), couponCode: "NEW10" };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.couponCode).toBe("NEW10");
    }
  });

  it("accepts optional gstin and businessName (B2B fields)", () => {
    const payload = {
      ...validCheckoutPayload(),
      gstin: "29ABCDE1234F1Z5",
      businessName: "Sharma Enterprises Pvt Ltd",
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts multiple items in cart", () => {
    const payload = {
      ...validCheckoutPayload(),
      items: [
        { productSlug: "5-blade-chopper", variantId: "single", qty: 2 },
        { productSlug: "rapid-peeler", variantId: "single", qty: 1 },
      ],
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ── checkoutSchema — failing cases ────────────────────────────────────────────

describe("checkoutSchema — invalid payloads", () => {
  it("rejects missing region", () => {
    const { region: _omit, ...payload } = validCheckoutPayload();
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects invalid region value", () => {
    const payload = { ...validCheckoutPayload(), region: "us" };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects missing method", () => {
    const { method: _omit, ...payload } = validCheckoutPayload();
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects invalid method value", () => {
    const payload = { ...validCheckoutPayload(), method: "crypto" };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const payload = { ...validCheckoutPayload(), items: [] };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects item with missing productSlug", () => {
    const payload = {
      ...validCheckoutPayload(),
      items: [{ variantId: "single", qty: 1 }],
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects item with qty=0", () => {
    const payload = {
      ...validCheckoutPayload(),
      items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: 0 }],
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects item with negative qty", () => {
    const payload = {
      ...validCheckoutPayload(),
      items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: -1 }],
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects item with fractional qty", () => {
    const payload = {
      ...validCheckoutPayload(),
      items: [{ productSlug: "5-blade-chopper", variantId: "single", qty: 1.5 }],
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects missing customer object", () => {
    const { customer: _omit, ...payload } = validCheckoutPayload();
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects empty customer name", () => {
    const payload = {
      ...validCheckoutPayload(),
      customer: { name: "", phone: "+91 98765 43210" },
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects customer phone that is too short (< 5 chars)", () => {
    const payload = {
      ...validCheckoutPayload(),
      customer: { name: "Test", phone: "123" },
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format in customer", () => {
    const payload = {
      ...validCheckoutPayload(),
      customer: { name: "Test", phone: "9876543210", email: "not-an-email" },
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects shippingAddress as an object (must be string)", () => {
    const payload = {
      ...validCheckoutPayload(),
      shippingAddress: { street: "123 Main", city: "Mumbai" },
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects entirely null payload", () => {
    const result = checkoutSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects non-object payload", () => {
    const result = checkoutSchema.safeParse("checkout");
    expect(result.success).toBe(false);
  });
});

// ── verifySchema ──────────────────────────────────────────────────────────────

describe("verifySchema — valid Razorpay verify body", () => {
  const validVerify = {
    orderCode: "CHOP-AB1CD-1234",
    razorpay_order_id: "order_EtE3oTi0YI3Lcy",
    razorpay_payment_id: "pay_EtEwk0BFQmF3UW",
    razorpay_signature: "a".repeat(64),
  };

  it("accepts a valid verify body", () => {
    const result = verifySchema.safeParse(validVerify);
    expect(result.success).toBe(true);
  });

  it("rejects missing orderCode", () => {
    const { orderCode: _omit, ...payload } = validVerify;
    expect(verifySchema.safeParse(payload).success).toBe(false);
  });

  it("rejects missing razorpay_order_id", () => {
    const { razorpay_order_id: _omit, ...payload } = validVerify;
    expect(verifySchema.safeParse(payload).success).toBe(false);
  });

  it("rejects missing razorpay_payment_id", () => {
    const { razorpay_payment_id: _omit, ...payload } = validVerify;
    expect(verifySchema.safeParse(payload).success).toBe(false);
  });

  it("rejects missing razorpay_signature", () => {
    const { razorpay_signature: _omit, ...payload } = validVerify;
    expect(verifySchema.safeParse(payload).success).toBe(false);
  });

  it("rejects empty-string orderCode", () => {
    expect(verifySchema.safeParse({ ...validVerify, orderCode: "" }).success).toBe(false);
  });

  it("rejects empty-string razorpay_signature", () => {
    expect(verifySchema.safeParse({ ...validVerify, razorpay_signature: "" }).success).toBe(false);
  });
});
