import "server-only";
import Stripe from "stripe";

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.warn("[stripe] STRIPE_SECRET_KEY not configured.");
    return null;
  }
  return new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
}

// ─── Payment Intent creation ─────────────────────────────────────────────────

export interface StripePaymentIntentResult {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

/**
 * Create a Stripe PaymentIntent. Returns null when STRIPE_SECRET_KEY is unset.
 */
export async function createPaymentIntent(
  amountMinor: number,
  currency: string,
  metadata: Record<string, string>,
): Promise<StripePaymentIntentResult | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const intent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  if (!intent.client_secret) {
    throw new Error("[stripe] PaymentIntent created without client_secret.");
  }

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
  };
}

// ─── Webhook event construction ──────────────────────────────────────────────

/**
 * Verify and construct a Stripe webhook event from the raw body string and
 * Stripe-Signature header. Returns null when STRIPE_WEBHOOK_SECRET is unset.
 */
export function constructWebhookEvent(
  rawBody: string,
  sig: string,
): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[stripe] STRIPE_WEBHOOK_SECRET not set — cannot verify webhook.");
    return null;
  }
  const stripe = getStripeClient();
  if (!stripe) return null;

  return stripe.webhooks.constructEvent(rawBody, sig, secret);
}
