import type { Region, RegionId } from "./types";
import { getRegion } from "./regions";

/**
 * Format an integer minor-unit amount (paise/cents) into a localized currency
 * string. e.g. formatMoney(99900, "in") -> "₹999"
 */
export function formatMoney(minor: number, region: RegionId | Region): string {
  const r = typeof region === "string" ? getRegion(region) : region;
  const major = minor / 100;
  const hasFraction = minor % 100 !== 0;
  return new Intl.NumberFormat(r.locale, {
    style: "currency",
    currency: r.currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major);
}

/** Price for a region from a RegionPrice map. */
export function priceFor(
  map: Partial<Record<RegionId, number>>,
  region: RegionId,
): number {
  return map[region] ?? 0;
}

/** Percent off, rounded, from compareAt vs price. Returns 0 when no discount. */
export function percentOff(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
