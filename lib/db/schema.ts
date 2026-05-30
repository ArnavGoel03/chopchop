import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { OrderItemSnapshot } from "../types";

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    region: text("region").notNull(), // "in" | "intl"
    status: text("status").notNull().default("pending"),
    method: text("method").notNull(), // "online" | "cod"
    currency: text("currency").notNull(),

    // Money is stored in integer minor units (paise/cents).
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull().default(0),
    codFee: integer("cod_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),

    items: jsonb("items").$type<OrderItemSnapshot[]>().notNull(),

    // Customer
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: jsonb("shipping_address").$type<Record<string, string>>(),
    gstin: text("gstin"),
    businessName: text("business_name"),

    // Payment gateway references
    provider: text("provider"), // "razorpay" | "stripe"
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    providerSignature: text("provider_signature"),

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_code_idx").on(t.code),
    index("orders_status_idx").on(t.status),
    index("orders_phone_idx").on(t.customerPhone),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
