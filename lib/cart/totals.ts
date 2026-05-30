import type {
  CartLine,
  CartTotals,
  PaymentMethod,
  RegionId,
  ResolvedCartLine,
} from "../types";
import { getProduct, getVariant } from "../catalog";
import { getRegion } from "../regions";

/** Resolve raw cart lines against the catalog for a given region. */
export function resolveLines(
  lines: CartLine[],
  region: RegionId,
): ResolvedCartLine[] {
  const out: ResolvedCartLine[] = [];
  for (const line of lines) {
    const product = getProduct(line.productSlug);
    if (!product) continue;
    const variant = getVariant(product, line.variantId);
    const unitPrice = variant.price[region] ?? 0;
    out.push({
      ...line,
      product,
      variant,
      unitPrice,
      lineTotal: unitPrice * line.qty,
    });
  }
  return out;
}

export const COUPONS: Record<string, { type: "flat" | "pct"; value: number }> = {
  SUMMER100: { type: "flat", value: 10000 },
  CHOPNOW150: { type: "flat", value: 15000 },
  FRIEND200: { type: "flat", value: 20000 },
  NEW10: { type: "pct", value: 10 },
};

/**
 * Compute order totals. Coupon flat values are in INR paise; for intl they are
 * scaled down by 100 so ₹100 off ≈ $1 off equivalent tier. Pct coupons are
 * region-agnostic.
 */
export function computeTotals(
  resolved: ResolvedCartLine[],
  region: RegionId,
  opts: { method?: PaymentMethod; couponCode?: string } = {},
): CartTotals {
  const r = getRegion(region);
  const subtotal = resolved.reduce((n, l) => n + l.lineTotal, 0);

  let discount = 0;
  const coupon = opts.couponCode
    ? COUPONS[opts.couponCode.trim().toUpperCase()]
    : undefined;
  if (coupon) {
    if (coupon.type === "pct") {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discount = region === "in" ? coupon.value : Math.round(coupon.value / 100);
    }
  }
  discount = Math.min(discount, subtotal);

  const shipping =
    subtotal > 0 && (r.freeShipThreshold === 0 || subtotal >= r.freeShipThreshold)
      ? 0
      : r.flatShipping;

  const codFee = opts.method === "cod" && r.codAvailable ? r.codFee : 0;

  const total = Math.max(0, subtotal - discount + shipping + codFee);

  return { subtotal, shipping, codFee, discount, total, currency: r.currency };
}
