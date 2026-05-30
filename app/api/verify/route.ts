export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySchema } from "@/lib/validation";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { markPaid, getOrderByCode } from "@/lib/orders";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    orderCode,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = parsed.data;

  // Verify signature: HMAC-SHA256(order_id|payment_id, KEY_SECRET)
  const valid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "Signature verification failed." },
      { status: 400 },
    );
  }

  // Ensure the order exists and belongs to this Razorpay order ID
  const order = await getOrderByCode(orderCode);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found." },
      { status: 404 },
    );
  }

  // An online order being verified MUST have a providerOrderId, and it must
  // match exactly — reject both null and mismatched IDs to prevent a valid
  // HMAC for any payment being claimed against a null-providerOrderId order.
  if (!order.providerOrderId || order.providerOrderId !== razorpay_order_id) {
    return NextResponse.json(
      { ok: false, error: "Order ID mismatch." },
      { status: 400 },
    );
  }

  await markPaid(orderCode, razorpay_payment_id, razorpay_signature);

  return NextResponse.json({ ok: true, status: "paid" });
}
