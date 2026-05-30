/**
 * Order service — the single place orders are created and mutated.
 *
 * DB fallback: when DATABASE_URL is not set, `hasDb` is false and we use an
 * in-memory Map so the entire checkout flow still works during local dev
 * without a Neon instance. Orders in the Map are lost on server restart —
 * fine for dev; never use in production.
 */
import "server-only";
import type { OrderItemSnapshot, OrderStatus, PaymentMethod, RegionId } from "./types";
import type { CartTotals } from "./types";
import { db, hasDb } from "./db";
import { orders } from "./db/schema";
import type { NewOrder, OrderRow } from "./db/schema";
import { generateOrderCode } from "./utils";
import { eq, desc } from "drizzle-orm";

// ─── Public interface ────────────────────────────────────────────────────────

export interface CreateOrderInput {
  region: RegionId;
  method: PaymentMethod;
  items: OrderItemSnapshot[];
  totals: CartTotals;
  couponCode?: string;
  customer: { name: string; phone: string; email?: string };
  shippingAddress?: Record<string, string>;
  gstin?: string;
  businessName?: string;
  provider?: "razorpay" | "stripe";
  providerOrderId?: string;
}

export interface OrderRecord {
  code: string;
  status: OrderStatus;
  region: RegionId;
  method: PaymentMethod;
  currency: string;
  subtotal: number;
  shipping: number;
  codFee: number;
  discount: number;
  total: number;
  items: OrderItemSnapshot[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress?: Record<string, string> | null;
  gstin?: string | null;
  businessName?: string | null;
  provider?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  createdAt: string;
}

// ─── In-memory fallback store ────────────────────────────────────────────────

const memStore = new Map<string, OrderRecord>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToRecord(row: OrderRow): OrderRecord {
  return {
    code: row.code,
    status: row.status as OrderStatus,
    region: row.region as RegionId,
    method: row.method as PaymentMethod,
    currency: row.currency,
    subtotal: row.subtotal,
    shipping: row.shipping,
    codFee: row.codFee,
    discount: row.discount,
    total: row.total,
    items: (row.items ?? []) as OrderItemSnapshot[],
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    shippingAddress: row.shippingAddress as Record<string, string> | null,
    gstin: row.gstin,
    businessName: row.businessName,
    provider: row.provider,
    providerOrderId: row.providerOrderId,
    providerPaymentId: row.providerPaymentId,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const code = generateOrderCode();
  const status: OrderStatus =
    input.method === "cod" ? "cod_confirmed" : "pending";

  const now = new Date().toISOString();

  if (!hasDb || !db) {
    // In-memory path
    const record: OrderRecord = {
      code,
      status,
      region: input.region,
      method: input.method,
      currency: input.totals.currency,
      subtotal: input.totals.subtotal,
      shipping: input.totals.shipping,
      codFee: input.totals.codFee,
      discount: input.totals.discount,
      total: input.totals.total,
      items: input.items,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerEmail: input.customer.email ?? null,
      shippingAddress: input.shippingAddress ?? null,
      gstin: input.gstin ?? null,
      businessName: input.businessName ?? null,
      provider: input.provider ?? null,
      providerOrderId: input.providerOrderId ?? null,
      providerPaymentId: null,
      createdAt: now,
    };
    memStore.set(code, record);
    return record;
  }

  const newOrder: NewOrder = {
    code,
    region: input.region,
    status,
    method: input.method,
    currency: input.totals.currency,
    subtotal: input.totals.subtotal,
    shipping: input.totals.shipping,
    codFee: input.totals.codFee,
    discount: input.totals.discount,
    total: input.totals.total,
    couponCode: input.couponCode,
    items: input.items,
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    customerEmail: input.customer.email,
    shippingAddress: input.shippingAddress,
    gstin: input.gstin,
    businessName: input.businessName,
    provider: input.provider,
    providerOrderId: input.providerOrderId,
  };

  const [row] = await db.insert(orders).values(newOrder).returning();
  return rowToRecord(row);
}

export async function getOrderByCode(code: string): Promise<OrderRecord | null> {
  if (!hasDb || !db) {
    return memStore.get(code) ?? null;
  }
  const [row] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  return row ? rowToRecord(row) : null;
}

export async function markPaid(
  code: string,
  providerPaymentId: string,
  signature?: string,
): Promise<void> {
  if (!hasDb || !db) {
    const rec = memStore.get(code);
    if (rec) {
      rec.status = "paid";
      rec.providerPaymentId = providerPaymentId;
    }
    return;
  }

  await db
    .update(orders)
    .set({
      status: "paid",
      providerPaymentId,
      providerSignature: signature,
      updatedAt: new Date(),
    })
    .where(eq(orders.code, code));
}

export async function updateOrderStatus(
  code: string,
  status: OrderStatus,
): Promise<void> {
  if (!hasDb || !db) {
    const rec = memStore.get(code);
    if (rec) rec.status = status;
    return;
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.code, code));
}

export async function listOrders(
  opts: { limit?: number; status?: OrderStatus } = {},
): Promise<OrderRecord[]> {
  const limit = opts.limit ?? 50;

  if (!hasDb || !db) {
    let rows = Array.from(memStore.values());
    if (opts.status) rows = rows.filter((r) => r.status === opts.status);
    // Sort newest first by createdAt string (ISO is lexicographically sortable)
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, limit);
  }

  const query = db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const rows = opts.status
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.status, opts.status))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
    : await query;

  return rows.map(rowToRecord);
}
