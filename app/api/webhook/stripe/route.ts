export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { markPaid, listOrders } from "@/lib/orders";
import type Stripe from "stripe";

// Stripe requires raw body for signature verification — do NOT JSON.parse
// before constructing the event.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const result = constructWebhookEvent(rawBody, sig);
    if (!result) {
      // STRIPE_WEBHOOK_SECRET not configured — accept the event without verification
      // in dev, but log a warning.
      console.warn("[stripe webhook] Secret not configured — skipping verification.");
      return NextResponse.json({ ok: true });
    }
    event = result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe webhook] constructWebhookEvent failed:", message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = intent.id;

    // Find order by providerOrderId (stored as the PaymentIntent ID)
    const recentOrders = await listOrders({ limit: 200, status: "pending" });
    const order = recentOrders.find((o) => o.providerOrderId === paymentIntentId);

    if (order) {
      await markPaid(order.code, paymentIntentId);
    } else {
      console.warn(
        `[stripe webhook] No pending order found for providerOrderId=${paymentIntentId}`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
