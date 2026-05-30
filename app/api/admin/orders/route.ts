/**
 * /api/admin/orders
 * POST { code, status } → updateOrderStatus
 * GET  ?limit=N&status=S → listOrders (optional filters)
 * All routes require a valid admin session.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listOrders, updateOrderStatus } from "@/lib/orders";
import { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "cod_confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function isValidStatus(s: unknown): s is OrderStatus {
  return VALID_STATUSES.includes(s as OrderStatus);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const statusParam = searchParams.get("status");
  const status = isValidStatus(statusParam) ? statusParam : undefined;

  const orders = await listOrders({ limit, status });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, status } = body as { code?: unknown; status?: unknown };

  if (typeof code !== "string" || !code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  if (!isValidStatus(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  await updateOrderStatus(code, status);
  return NextResponse.json({ ok: true });
}
