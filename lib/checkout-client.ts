"use client";

import type { CartTotals, PaymentMethod, RegionId, ResolvedCartLine } from "./types";

// ─── Payload builders ────────────────────────────────────────────────────────

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface CheckoutPayload {
  region: RegionId;
  items: {
    productSlug: string;
    name: string;
    variantId: string;
    variantLabel: string;
    qty: number;
    unitPrice: number;
  }[];
  totals: CartTotals;
  couponCode?: string;
  customer: CheckoutCustomer;
  method: PaymentMethod;
  shippingAddress?: string;
  gstin?: string;
  businessName?: string;
}

export function buildCheckoutPayload(
  region: RegionId,
  lines: ResolvedCartLine[],
  totals: CartTotals,
  customer: CheckoutCustomer,
  method: PaymentMethod,
  opts: {
    couponCode?: string;
    shippingAddress?: string;
    gstin?: string;
    businessName?: string;
  } = {},
): CheckoutPayload {
  return {
    region,
    items: lines.map((l) => ({
      productSlug: l.productSlug,
      name: l.product.name,
      variantId: l.variantId,
      variantLabel: l.variant.label,
      qty: l.qty,
      unitPrice: l.unitPrice,
    })),
    totals,
    couponCode: opts.couponCode,
    customer,
    method,
    shippingAddress: opts.shippingAddress,
    gstin: opts.gstin,
    businessName: opts.businessName,
  };
}

// ─── Online checkout response shapes ─────────────────────────────────────────

export interface CheckoutResponseOnline {
  ok: true;
  orderCode: string;
  provider: "razorpay" | "stripe";
  providerOrderId: string;
  amount: number;
  currency: string;
  // Razorpay
  keyId?: string;
  // Stripe
  clientSecret?: string;
}

export interface CheckoutResponseCod {
  ok: true;
  orderCode: string;
}

export type CheckoutResponse =
  | CheckoutResponseOnline
  | CheckoutResponseCod
  | { ok: false; error?: string };

export interface VerifyPayload {
  orderCode: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyResponse {
  ok: boolean;
  status?: string;
  error?: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function callCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as CheckoutResponse;
    return json;
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function callVerify(payload: VerifyPayload): Promise<VerifyResponse> {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as VerifyResponse;
    return json;
  } catch {
    return { ok: false, error: "Verification failed. Please contact support." };
  }
}

// ─── Razorpay gateway ─────────────────────────────────────────────────────────

/** Script injector — idempotent, returns a promise that resolves when ready. */
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayOpts {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  orderCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

/**
 * Open Razorpay checkout modal. Resolves with the handler payload on success,
 * rejects with an error message if closed/failed.
 */
export function runRazorpay(opts: RazorpayOpts): Promise<{
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("Payment unavailable");
      return;
    }
    // Gateway boundary: Razorpay injects a global constructor.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RazorpayConstructor = (window as any).Razorpay;
    if (!RazorpayConstructor) {
      reject("Payment system unavailable");
      return;
    }
    const rzp = new RazorpayConstructor({
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency,
      order_id: opts.providerOrderId,
      name: "CHOP.",
      description: `Order ${opts.orderCode}`,
      prefill: {
        name: opts.customerName,
        email: opts.customerEmail ?? "",
        contact: opts.customerPhone,
      },
      theme: { color: "#C24A2D" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: (response: any) => {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject("Payment cancelled"),
      },
    });
    rzp.open();
  });
}

// ─── Stripe gateway ───────────────────────────────────────────────────────────

export function loadStripe(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Stripe) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface StripeOpts {
  publishableKey: string;
  clientSecret: string;
  customerEmail?: string;
  returnUrl: string; // confirmation page URL
}

/**
 * Confirm a Stripe PaymentIntent. On success the browser redirects (stripe.confirmPayment
 * redirects automatically); on error, rejects with the error message.
 */
export async function runStripe(opts: StripeOpts): Promise<void> {
  if (typeof window === "undefined") throw new Error("Payment unavailable");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StripeConstructor = (window as any).Stripe;
  if (!StripeConstructor) throw new Error("Payment system unavailable");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe: any = StripeConstructor(opts.publishableKey);

  const result = await stripe.confirmPayment({
    clientSecret: opts.clientSecret,
    confirmParams: {
      return_url: opts.returnUrl,
      receipt_email: opts.customerEmail,
    },
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Payment failed");
  }
  // Stripe redirects on success — no explicit resolve needed.
}
