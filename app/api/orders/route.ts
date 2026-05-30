export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getOrderByCode } from "@/lib/orders";

// Public-safe order tracking endpoint.
// Returns only: code, status, region, total, currency, method, items, createdAt
// DOES NOT leak: phone, email, shippingAddress, gstin, businessName, or payment refs.

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing ?code= parameter." },
      { status: 400 },
    );
  }

  const order = await getOrderByCode(code);

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found." },
      { status: 404 },
    );
  }

  // Return only public-safe fields
  return NextResponse.json({
    ok: true,
    order: {
      code: order.code,
      status: order.status,
      region: order.region,
      total: order.total,
      currency: order.currency,
      method: order.method,
      items: order.items,
      createdAt: order.createdAt,
    },
  });
}
