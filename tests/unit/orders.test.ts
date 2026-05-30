/**
 * tests/unit/orders.test.ts
 *
 * Unit tests for lib/orders.ts using the in-memory fallback store.
 * DATABASE_URL must be unset so db === null and memStore is used.
 *
 * Tests:
 *  - createOrder: returns CHOP- code, correct fields, pending for online
 *  - createOrder: cod_confirmed for COD method
 *  - getOrderByCode: round-trips
 *  - getOrderByProviderOrderId: finds by provider id
 *  - markPaid: transitions pending → paid, sets providerPaymentId
 *  - markPaid: IDEMPOTENT — calling twice stays "paid"
 *  - markPaid: no-op on terminal statuses (shipped/delivered/refunded/cancelled)
 *  - updateOrderStatus: updates status
 *  - listOrders: limit and status filter
 *
 * NOTE: The in-memory Map is module-level state. Each describe block uses
 * vi.resetModules() + a fresh dynamic import in beforeEach to get a clean
 * memStore. vi.mock is declared once at module top-level (it is hoisted by
 * vitest regardless of placement, so putting it here avoids the warning).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CreateOrderInput } from "@/lib/orders";
import type { CartTotals } from "@/lib/types";

// ── Top-level mocks (hoisted) ─────────────────────────────────────────────────
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: null, hasDb: false, schema: {} }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  const totals: CartTotals = {
    subtotal: 99900,
    shipping: 0,
    codFee: 0,
    discount: 0,
    total: 99900,
    currency: "INR",
  };

  return {
    region: "in",
    method: "online",
    items: [
      {
        productSlug: "5-blade-chopper",
        name: "CHOP. 5-Blade Chopper",
        variantId: "single",
        variantLabel: "Single",
        qty: 1,
        unitPrice: 99900,
      },
    ],
    totals,
    customer: {
      name: "Priya Sharma",
      phone: "+91 98765 43210",
    },
    shippingAddress: "123, MG Road, Bengaluru 560001",
    provider: "razorpay",
    providerOrderId: "order_test123",
    ...overrides,
  };
}

// Each describe resets modules + re-imports to get a fresh in-memory store.
async function freshOrders() {
  vi.resetModules();
  return import("@/lib/orders");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("orders — createOrder (in-memory)", () => {
  let createOrder: typeof import("@/lib/orders").createOrder;

  beforeEach(async () => {
    ({ createOrder } = await freshOrders());
  });

  it("returns an order with a CHOP- code", async () => {
    const order = await createOrder(makeInput());
    expect(order.code).toMatch(/^CHOP-[A-Z0-9]{5}-\d{4}$/);
  });

  it("sets status to 'pending' for online payment method", async () => {
    const order = await createOrder(makeInput({ method: "online" }));
    expect(order.status).toBe("pending");
  });

  it("sets status to 'cod_confirmed' for COD payment method", async () => {
    const order = await createOrder(
      makeInput({
        method: "cod",
        totals: {
          subtotal: 99900,
          shipping: 0,
          codFee: 5000,
          discount: 0,
          total: 104900,
          currency: "INR",
        },
      }),
    );
    expect(order.status).toBe("cod_confirmed");
  });

  it("reflects the correct region, currency, and totals", async () => {
    const totals: CartTotals = {
      subtotal: 179900,
      shipping: 0,
      codFee: 0,
      discount: 10000,
      total: 169900,
      currency: "INR",
    };
    const order = await createOrder(makeInput({ region: "in", totals }));
    expect(order.region).toBe("in");
    expect(order.currency).toBe("INR");
    expect(order.subtotal).toBe(179900);
    expect(order.discount).toBe(10000);
    expect(order.total).toBe(169900);
  });

  it("reflects customer data", async () => {
    const order = await createOrder(
      makeInput({ customer: { name: "Arjun Mehta", phone: "9876543210", email: "arjun@test.com" } }),
    );
    expect(order.customerName).toBe("Arjun Mehta");
    expect(order.customerPhone).toBe("9876543210");
    expect(order.customerEmail).toBe("arjun@test.com");
  });

  it("reflects providerOrderId", async () => {
    const order = await createOrder(makeInput({ providerOrderId: "order_xyz789" }));
    expect(order.providerOrderId).toBe("order_xyz789");
  });

  it("providerPaymentId is null initially", async () => {
    const order = await createOrder(makeInput());
    expect(order.providerPaymentId).toBeNull();
  });

  it("createdAt is an ISO string", async () => {
    const order = await createOrder(makeInput());
    expect(() => new Date(order.createdAt)).not.toThrow();
    expect(isNaN(new Date(order.createdAt).getTime())).toBe(false);
  });
});

describe("orders — getOrderByCode round-trip", () => {
  let mod: Awaited<ReturnType<typeof freshOrders>>;

  beforeEach(async () => {
    mod = await freshOrders();
  });

  it("finds the order by its code", async () => {
    const order = await mod.createOrder(makeInput());
    const found = await mod.getOrderByCode(order.code);
    expect(found).not.toBeNull();
    expect(found?.code).toBe(order.code);
  });

  it("returns null for a non-existent code", async () => {
    const found = await mod.getOrderByCode("CHOP-ZZZZZ-9999");
    expect(found).toBeNull();
  });
});

describe("orders — getOrderByProviderOrderId", () => {
  let mod: Awaited<ReturnType<typeof freshOrders>>;

  beforeEach(async () => {
    mod = await freshOrders();
  });

  it("finds the order by providerOrderId", async () => {
    const order = await mod.createOrder(makeInput({ providerOrderId: "order_findme" }));
    const found = await mod.getOrderByProviderOrderId("order_findme");
    expect(found).not.toBeNull();
    expect(found?.code).toBe(order.code);
  });

  it("returns null when providerOrderId doesn't exist", async () => {
    const found = await mod.getOrderByProviderOrderId("order_doesnotexist");
    expect(found).toBeNull();
  });

  it("returns the correct order when multiple orders exist", async () => {
    await mod.createOrder(makeInput({ providerOrderId: "order_first" }));
    const second = await mod.createOrder(makeInput({ providerOrderId: "order_second" }));
    const found = await mod.getOrderByProviderOrderId("order_second");
    expect(found?.code).toBe(second.code);
  });
});

describe("orders — markPaid", () => {
  let mod: Awaited<ReturnType<typeof freshOrders>>;

  beforeEach(async () => {
    mod = await freshOrders();
  });

  it("transitions pending → paid and sets providerPaymentId", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    expect(order.status).toBe("pending");

    await mod.markPaid(order.code, "pay_abc123");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("paid");
    expect(updated?.providerPaymentId).toBe("pay_abc123");
  });

  it("is IDEMPOTENT — calling markPaid twice stays 'paid'", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.markPaid(order.code, "pay_first");
    await mod.markPaid(order.code, "pay_second"); // Should be a no-op
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("paid");
    // providerPaymentId should still be the first one (idempotency preserved)
    expect(updated?.providerPaymentId).toBe("pay_first");
  });

  it("is NO-OP on 'shipped' status (terminal)", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.updateOrderStatus(order.code, "shipped");
    await mod.markPaid(order.code, "pay_should_not_set");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("shipped");
  });

  it("is NO-OP on 'delivered' status (terminal)", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.updateOrderStatus(order.code, "delivered");
    await mod.markPaid(order.code, "pay_should_not_set");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("delivered");
  });

  it("is NO-OP on 'refunded' status (terminal)", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.updateOrderStatus(order.code, "refunded");
    await mod.markPaid(order.code, "pay_should_not_set");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("refunded");
  });

  it("is NO-OP on 'cancelled' status (terminal)", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.updateOrderStatus(order.code, "cancelled");
    await mod.markPaid(order.code, "pay_should_not_set");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("cancelled");
  });

  it("is NO-OP on already 'paid' status (terminal)", async () => {
    const order = await mod.createOrder(makeInput({ method: "online" }));
    await mod.markPaid(order.code, "pay_original");
    // Mark paid again — should not overwrite
    await mod.markPaid(order.code, "pay_duplicate");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("paid");
    expect(updated?.providerPaymentId).toBe("pay_original");
  });

  it("silently ignores markPaid for a non-existent code — no throw", async () => {
    await expect(mod.markPaid("CHOP-GHOST-0000", "pay_noop")).resolves.not.toThrow();
  });
});

describe("orders — updateOrderStatus", () => {
  let mod: Awaited<ReturnType<typeof freshOrders>>;

  beforeEach(async () => {
    mod = await freshOrders();
  });

  it("updates the order status", async () => {
    const order = await mod.createOrder(makeInput());
    await mod.updateOrderStatus(order.code, "shipped");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("shipped");
  });

  it("can transition through multiple statuses", async () => {
    const order = await mod.createOrder(makeInput());
    await mod.updateOrderStatus(order.code, "paid");
    await mod.updateOrderStatus(order.code, "shipped");
    await mod.updateOrderStatus(order.code, "delivered");
    const updated = await mod.getOrderByCode(order.code);
    expect(updated?.status).toBe("delivered");
  });
});

describe("orders — listOrders", () => {
  let mod: Awaited<ReturnType<typeof freshOrders>>;

  beforeEach(async () => {
    mod = await freshOrders();
  });

  it("returns all created orders", async () => {
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    const all = await mod.listOrders();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("respects the limit option", async () => {
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    const limited = await mod.listOrders({ limit: 2 });
    expect(limited.length).toBeLessThanOrEqual(2);
  });

  it("filters by status", async () => {
    const order1 = await mod.createOrder(makeInput({ method: "online" }));
    const order2 = await mod.createOrder(makeInput({ method: "online" }));
    await mod.createOrder(makeInput({ method: "cod" })); // cod_confirmed

    await mod.updateOrderStatus(order1.code, "shipped");
    // order2 stays pending

    const shipped = await mod.listOrders({ status: "shipped" });
    expect(shipped.every((o) => o.status === "shipped")).toBe(true);
    expect(shipped.some((o) => o.code === order1.code)).toBe(true);
    expect(shipped.some((o) => o.code === order2.code)).toBe(false);
  });

  it("returns results sorted newest-first (ISO lexicographic)", async () => {
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    await mod.createOrder(makeInput());
    const all = await mod.listOrders();
    // Verify the list is sorted in descending createdAt order.
    // Use >= to tolerate same-millisecond creates (identical ISO strings are equal).
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].createdAt >= all[i].createdAt).toBe(true);
    }
  });

  it("returns empty array when no orders match the status filter", async () => {
    const results = await mod.listOrders({ status: "refunded" });
    expect(results).toHaveLength(0);
  });
});
