export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { resolveLines, computeTotals } from "@/lib/cart/totals";
import { createOrder } from "@/lib/orders";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { createPaymentIntent } from "@/lib/payments/stripe";
import type { OrderItemSnapshot } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse & validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // 2. Reject COD for international
  if (input.method === "cod" && input.region === "intl") {
    return NextResponse.json(
      { ok: false, error: "Cash on delivery is not available for international orders." },
      { status: 400 },
    );
  }

  // 3. RECOMPUTE totals server-side — never trust client amounts
  const cartLines = input.items.map((i) => ({
    productSlug: i.productSlug,
    variantId: i.variantId,
    qty: i.qty,
  }));

  const resolved = resolveLines(cartLines, input.region);
  if (resolved.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid items found in cart." },
      { status: 400 },
    );
  }

  const totals = computeTotals(resolved, input.region, {
    method: input.method,
    couponCode: input.couponCode,
  });

  // 4. Build item snapshots from resolved catalog data
  const items: OrderItemSnapshot[] = resolved.map((l) => ({
    productSlug: l.productSlug,
    name: l.product.name,
    variantId: l.variantId,
    variantLabel: l.variant.label,
    qty: l.qty,
    unitPrice: l.unitPrice,
  }));

  // 5. Handle each payment path
  if (input.method === "cod") {
    // COD: persist order immediately as cod_confirmed
    const order = await createOrder({
      region: input.region,
      method: "cod",
      items,
      totals,
      couponCode: input.couponCode,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      gstin: input.gstin,
      businessName: input.businessName,
    });

    return NextResponse.json({ ok: true, orderCode: order.code });
  }

  // online payment
  if (input.region === "in") {
    // Razorpay path
    const rzpOrder = await createRazorpayOrder(
      totals.total,
      totals.currency,
      `chop_${Date.now()}`,
    );

    const order = await createOrder({
      region: input.region,
      method: "online",
      items,
      totals,
      couponCode: input.couponCode,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      gstin: input.gstin,
      businessName: input.businessName,
      provider: "razorpay",
      providerOrderId: rzpOrder?.id,
    });

    if (!rzpOrder) {
      // Keys not configured — fall back to WhatsApp flow
      return NextResponse.json({
        ok: true,
        orderCode: order.code,
        provider: "none",
        amount: totals.total,
        currency: totals.currency,
      });
    }

    return NextResponse.json({
      ok: true,
      orderCode: order.code,
      provider: "razorpay",
      providerOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    });
  }

  // Stripe (intl)
  const intent = await createPaymentIntent(
    totals.total,
    totals.currency,
    {
      region: input.region,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
    },
  );

  const order = await createOrder({
    region: input.region,
    method: "online",
    items,
    totals,
    couponCode: input.couponCode,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    gstin: input.gstin,
    businessName: input.businessName,
    provider: "stripe",
    providerOrderId: intent?.id,
  });

  if (!intent) {
    return NextResponse.json({
      ok: true,
      orderCode: order.code,
      provider: "none",
      amount: totals.total,
      currency: totals.currency,
    });
  }

  return NextResponse.json({
    ok: true,
    orderCode: order.code,
    provider: "stripe",
    clientSecret: intent.clientSecret,
    amount: intent.amount,
    currency: intent.currency,
  });
}
