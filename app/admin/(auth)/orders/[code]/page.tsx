export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByCode } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { StatusSelect } from "@/components/admin/StatusSelect";
import type { OrderStatus } from "@/lib/types";

function statusTone(s: OrderStatus): "paper" | "ink" | "mint" | "tomato" {
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
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper-2 border border-line rounded-2xl p-6">
      <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1.5 border-b border-line last:border-0">
      <span className="text-ink-soft shrink-0">{label}</span>
      <span className="text-ink font-medium text-right">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const itemCount = order.items.reduce((s, it) => s + it.qty, 0);

  return (
    <>
      {/* breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/admin" className="hover:text-ink transition-colors">
          Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-ink font-semibold">{order.code}</span>
      </div>

      {/* heading row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink">
            {order.code}
          </h2>
          <p className="text-sm text-ink-soft mt-0.5">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(order.status)}>
            {statusLabel(order.status)}
          </Badge>
          <StatusSelect code={order.code} current={order.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* customer */}
        <Section title="Customer">
          <Row label="Name" value={order.customerName} />
          <Row label="Phone" value={order.customerPhone} />
          {order.customerEmail && (
            <Row label="Email" value={order.customerEmail} />
          )}
          <Row
            label="Region"
            value={
              <span className="uppercase font-bold">{order.region}</span>
            }
          />
          <Row
            label="Method"
            value={
              order.method === "cod"
                ? "Cash on Delivery"
                : "Online"
            }
          />
        </Section>

        {/* shipping address */}
        {order.shippingAddress && (
          <Section title="Shipping address">
            <Row label="Address" value={order.shippingAddress} />
          </Section>
        )}

        {/* GST / business */}
        {(order.gstin || order.businessName) && (
          <Section title="Business / GST">
            {order.businessName && (
              <Row label="Business" value={order.businessName} />
            )}
            {order.gstin && <Row label="GSTIN" value={<span className="font-mono">{order.gstin}</span>} />}
          </Section>
        )}

        {/* payment */}
        {(order.provider || order.providerOrderId) && (
          <Section title="Payment">
            {order.provider && (
              <Row
                label="Provider"
                value={
                  <span className="capitalize">{order.provider}</span>
                }
              />
            )}
            {order.providerOrderId && (
              <Row
                label="Order ID"
                value={
                  <span className="font-mono text-xs">
                    {order.providerOrderId}
                  </span>
                }
              />
            )}
            {order.providerPaymentId && (
              <Row
                label="Payment ID"
                value={
                  <span className="font-mono text-xs">
                    {order.providerPaymentId}
                  </span>
                }
              />
            )}
          </Section>
        )}
      </div>

      {/* items */}
      <Section title={`Items (${itemCount})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-2 text-xs font-semibold text-ink-soft uppercase tracking-wider pr-4">
                  Product
                </th>
                <th className="pb-2 text-xs font-semibold text-ink-soft uppercase tracking-wider pr-4">
                  Variant
                </th>
                <th className="pb-2 text-xs font-semibold text-ink-soft uppercase tracking-wider text-center pr-4">
                  Qty
                </th>
                <th className="pb-2 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Unit price
                </th>
                <th className="pb-2 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">
                  Line total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr
                  key={`${item.variantId}-${i}`}
                  className={
                    i < order.items.length - 1 ? "border-b border-line" : ""
                  }
                >
                  <td className="py-3 pr-4 font-medium text-ink">
                    {item.name}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{item.variantLabel}</td>
                  <td className="py-3 pr-4 text-center text-ink-soft">
                    {item.qty}
                  </td>
                  <td className="py-3 text-right text-ink-soft">
                    {formatMoney(item.unitPrice, order.region)}
                  </td>
                  <td className="py-3 text-right font-semibold text-ink">
                    {formatMoney(item.unitPrice * item.qty, order.region)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* totals footer */}
        <div className="mt-4 border-t border-line pt-4 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, order.region)}</span>
          </div>
          {order.shipping > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{formatMoney(order.shipping, order.region)}</span>
            </div>
          )}
          {order.codFee > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>COD fee</span>
              <span>{formatMoney(order.codFee, order.region)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-mint">
              <span>Discount</span>
              <span>−{formatMoney(order.discount, order.region)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-ink text-base pt-2 border-t border-line">
            <span>Total</span>
            <span>{formatMoney(order.total, order.region)}</span>
          </div>
        </div>
      </Section>
    </>
  );
}
