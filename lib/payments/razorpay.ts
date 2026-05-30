import "server-only";
import crypto from "crypto";

// ─── Razorpay order creation ──────────────────────────────────────────────────

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Create a Razorpay order. Returns null when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
 * are not set (dev mode without keys).
 */
export async function createRazorpayOrder(
  amountMinor: number,
  currency: string,
  receipt: string,
): Promise<RazorpayOrder | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn("[razorpay] Keys not configured — skipping order creation.");
    return null;
  }

  // Use the razorpay npm SDK
  const Razorpay = (await import("razorpay")).default;
  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const order = await client.orders.create({
    amount: amountMinor,
    currency,
    receipt,
    payment_capture: true,
  });

  return order as unknown as RazorpayOrder;
}

// ─── Payment signature verification ─────────────────────────────────────────

/**
 * Verify the HMAC-SHA256 signature returned by Razorpay after payment.
 * Message: `<orderId>|<paymentId>`  Key: RAZORPAY_KEY_SECRET
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.warn("[razorpay] KEY_SECRET not set — cannot verify signature.");
    return false;
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Webhook signature verification ─────────────────────────────────────────

/**
 * Verify the X-Razorpay-Signature webhook header against the raw request body.
 * Uses RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[razorpay] WEBHOOK_SECRET not set — cannot verify webhook signature.",
    );
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
