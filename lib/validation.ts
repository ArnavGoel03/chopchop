import { z } from "zod";

// ─── Checkout ────────────────────────────────────────────────────────────────

const cartItemSchema = z.object({
  productSlug: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  region: z.enum(["in", "intl"]),
  method: z.enum(["online", "cod"]),
  items: z.array(cartItemSchema).min(1),
  customer: z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(5).max(25),
    email: z.string().email().optional(),
  }),
  couponCode: z.string().optional(),
  shippingAddress: z.string().min(1).optional(),
  gstin: z.string().optional(),
  businessName: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Payment verification (Razorpay) ────────────────────────────────────────

export const verifySchema = z.object({
  orderCode: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyInput = z.infer<typeof verifySchema>;
