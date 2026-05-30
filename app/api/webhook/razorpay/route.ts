export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { markPaid, getOrderByCode, listOrders } from "@/lib/orders";

// Razorpay requires raw body for signature verification — do NOT parse JSON
// before verifying.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  const valid = verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = event.event as string | undefined;

  if (eventType === "payment.captured") {
    const payload = event.payload as Record<string, unknown> | undefined;
    const paymentEntity = (
      payload?.payment as Record<string, unknown> | undefined
    )?.entity as Record<string, unknown> | undefined;

    if (paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id as string | undefined;
      const razorpayPaymentId = paymentEntity.id as string | undefined;

      if (razorpayOrderId && razorpayPaymentId) {
        // Find the order by providerOrderId
        // We need to look up by providerOrderId — search recent orders
        const recentOrders = await listOrders({ limit: 200, status: "pending" });
        const order = recentOrders.find(
          (o) => o.providerOrderId === razorpayOrderId,
        );

        if (order) {
          await markPaid(order.code, razorpayPaymentId);
        } else {
          console.warn(
            `[razorpay webhook] No pending order found for providerOrderId=${razorpayOrderId}`,
          );
        }
      }
    }
  }

  // Always respond 200 quickly so Razorpay doesn't retry
  return NextResponse.json({ ok: true });
}
