"use client";

import { formatMoney } from "@/lib/money";
import type { CartTotals, RegionId, ResolvedCartLine } from "@/lib/types";
import { getRegion } from "@/lib/regions";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

interface OrderSummaryProps {
  lines: ResolvedCartLine[];
  totals: CartTotals;
  regionId: RegionId;
  couponCode?: string;
  className?: string;
}

function Row({
  label,
  value,
  bold,
  accent,
  strikethrough,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-ink-soft", bold && "font-semibold text-ink")}>
        {label}
      </span>
      <span
        className={cn(
          bold && "font-bold text-ink",
          accent && "font-semibold text-mint",
          strikethrough && "line-through text-ink-soft",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderSummary({
  lines,
  totals,
  regionId,
  couponCode,
  className,
}: OrderSummaryProps) {
  const region = getRegion(regionId);

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-paper-2 p-5 space-y-4",
        className,
      )}
    >
      {/* Line items */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={`${line.productSlug}-${line.variantId}`} className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium leading-snug">
                {line.product.name}
              </p>
              <p className="text-[12px] text-ink-soft">
                {line.variant.label} × {line.qty}
              </p>
            </div>
            <span className="shrink-0 text-[14px] font-semibold tabular-nums">
              {formatMoney(line.lineTotal, regionId)}
            </span>
          </div>
        ))}
      </div>

      <hr className="border-line" />

      {/* Totals */}
      <div className="space-y-2">
        <Row
          label="Subtotal"
          value={formatMoney(totals.subtotal, regionId)}
        />
        <Row
          label="Shipping"
          value={totals.shipping === 0 ? "Free" : formatMoney(totals.shipping, regionId)}
        />
        {totals.codFee > 0 && (
          <Row
            label="COD handling"
            value={formatMoney(totals.codFee, regionId)}
          />
        )}
        {totals.discount > 0 && couponCode && (
          <Row
            label={`Coupon (${couponCode})`}
            value={`−${formatMoney(totals.discount, regionId)}`}
            accent
          />
        )}
      </div>

      <hr className="border-line" />

      <div className="flex items-center justify-between">
        <span className="font-display text-base font-semibold">Total</span>
        <span className="font-display text-xl font-bold tabular-nums">
          {formatMoney(totals.total, regionId)}
        </span>
      </div>

      {/* Tax note */}
      <p className="text-[12px] text-ink-soft leading-snug">
        {region.taxLabel}
        {regionId === "intl" && totals.shipping === 0 && (
          <> · Free shipping on this order</>
        )}
        {regionId === "intl" && totals.shipping > 0 && (
          <> · Free shipping over {formatMoney(region.freeShipThreshold, regionId)}</>
        )}
      </p>

      {/* Coupon note when no coupon applied */}
      {!couponCode && (
        <div className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <Tag size={12} />
          <span>Have a coupon? Enter it on the cart page.</span>
        </div>
      )}
    </div>
  );
}
