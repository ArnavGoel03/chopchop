import { formatMoney } from "@/lib/money";
import type { OrderItemSnapshot, RegionId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Order {
  code: string;
  status: string;
  region: RegionId;
  total: number;
  currency: string;
  method: "online" | "cod";
  items: OrderItemSnapshot[];
  createdAt: string;
}

export function OrderSummaryCard({
  order,
  className,
}: {
  order: Order;
  className?: string;
}) {
  const region = order.region;
  const createdDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-paper-2",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
            Order summary
          </p>
          <p className="mt-0.5 font-display text-sm font-semibold">{order.code}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-soft">{createdDate}</p>
          <p className="mt-0.5 text-xs font-medium capitalize text-ink-soft">
            {order.method === "cod" ? "Cash on delivery" : "Paid online"}
          </p>
        </div>
      </div>

      {/* Item list */}
      <ul className="divide-y divide-line" role="list">
        {order.items.map((item, idx) => (
          <li
            key={`${item.variantId}-${idx}`}
            className="flex items-start justify-between gap-4 px-5 py-4"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold leading-snug">{item.name}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{item.variantLabel}</p>
              <p className="mt-1 text-xs text-ink-soft">Qty: {item.qty}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {formatMoney(item.unitPrice * item.qty, region)}
              </p>
              {item.qty > 1 && (
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatMoney(item.unitPrice, region)} each
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-4">
        <p className="font-semibold">Total</p>
        <p className="font-display text-xl font-bold">
          {formatMoney(order.total, region)}
        </p>
      </div>
    </div>
  );
}
