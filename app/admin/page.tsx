export const runtime = "nodejs";

import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import type { OrderRecord } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

// ── helpers ─────────────────────────────────────────────────────────────────

function statusTone(
  s: OrderStatus,
): "paper" | "ink" | "mint" | "tomato" {
  switch (s) {
    case "delivered":
      return "mint";
    case "cancelled":
    case "refunded":
      return "tomato";
    case "pending":
      return "paper";
    default:
      return "ink";
  }
}

function statusLabel(s: OrderStatus): string {
  return s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-paper-2 border border-line rounded-2xl px-6 py-5">
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-soft mt-0.5">{sub}</p>}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const orders: OrderRecord[] = await listOrders();

  // ── compute summary stats ──────────────────────────────────────────────────
  const totalOrders = orders.length;
  const revenueIN = orders
    .filter((o) => o.region === "in")
    .reduce((s, o) => s + o.total, 0);
  const revenueINTL = orders
    .filter((o) => o.region === "intl")
    .reduce((s, o) => s + o.total, 0);
  const codCount = orders.filter((o) => o.method === "cod").length;
  const onlineCount = orders.filter((o) => o.method === "online").length;
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "cod_confirmed",
  ).length;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-ink">Orders</h2>
        <p className="text-sm text-ink-soft mt-0.5">
          All time — {totalOrders} order{totalOrders !== 1 ? "s" : ""}
        </p>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total orders" value={totalOrders} />
        <StatCard
          label="India revenue"
          value={revenueIN > 0 ? formatMoney(revenueIN, "in") : "—"}
        />
        <StatCard
          label="Intl revenue"
          value={revenueINTL > 0 ? formatMoney(revenueINTL, "intl") : "—"}
        />
        <StatCard
          label="Pending action"
          value={pendingCount}
          sub={`COD ${codCount} · Online ${onlineCount}`}
        />
      </div>

      {/* orders table */}
      {orders.length === 0 ? (
        <div className="bg-paper-2 border border-line rounded-2xl py-20 text-center">
          <p className="text-4xl mb-3">🫙</p>
          <p className="font-semibold text-ink">No orders yet</p>
          <p className="text-sm text-ink-soft mt-1">
            Orders will appear here once customers check out.
          </p>
        </div>
      ) : (
        <div className="bg-paper-2 border border-line rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider text-center">
                    Items
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.code}
                    className={`hover:bg-paper transition-colors ${
                      i < orders.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.code}`}
                        className="font-mono text-xs text-tomato font-semibold hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-xs font-bold text-ink-soft">
                        {order.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <span className="truncate block max-w-[140px]">
                        {order.customerName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-soft">
                      {order.items.reduce((s, it) => s + it.qty, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink whitespace-nowrap">
                      {formatMoney(order.total, order.region)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
