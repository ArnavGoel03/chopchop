export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { markPaid, getOrderByProviderOrderId } from "@/lib/orders";
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
      // STRIPE_WEBHOOK_SECRET is not configured — this is a misconfiguration,
      // not a valid state. Return 400 so the error surfaces loudly instead of
      // silently swallowing every webhook call.
      console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting webhook.");
      return NextResponse.json(
        { error: "Webhook secret not configured." },
        { status: 400 },
      );
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

    // Direct indexed lookup — not capped by a list limit.
    const order = await getOrderByProviderOrderId(paymentIntentId);

    if (order) {
      await markPaid(order.code, paymentIntentId);
    } else {
      console.warn(
        `[stripe webhook] No order found for providerOrderId=${paymentIntentId}`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
