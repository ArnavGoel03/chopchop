import type { Region, RegionId } from "./types";

export const REGIONS: Record<RegionId, Region> = {
  in: {
    id: "in",
    segment: "in",
    label: "India",
    currency: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
    paymentProvider: "razorpay",
    codAvailable: true,
    freeShipThreshold: 0, // free shipping across India
    flatShipping: 0,
    codFee: 5000, // ₹50 in paise
    taxLabel: "GST (incl.)",
    shippingCopy: "Free delivery · 3–7 working days · COD across 25,000+ pincodes",
    defaultCountry: "IN",
  },
  intl: {
    id: "intl",
    segment: "intl",
    label: "International",
    currency: "USD",
    currencySymbol: "$",
    locale: "en-US",
    paymentProvider: "stripe",
    codAvailable: false,
    freeShipThreshold: 5000, // free over $50 (cents)
    flatShipping: 900, // $9 flat (cents)
    codFee: 0,
    taxLabel: "VAT / Duties at delivery",
    shippingCopy: "Worldwide shipping · 7–14 business days · tracked & insured",
    defaultCountry: "US",
  },
};

export const DEFAULT_REGION: RegionId = "in";

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

export function isRegionId(value: string | undefined | null): value is RegionId {
  return value === "in" || value === "intl";
}

export function getRegion(id: string | undefined | null): Region {
  return isRegionId(id) ? REGIONS[id] : REGIONS[DEFAULT_REGION];
}

/** Map an ISO country code (from geo headers) to a storefront region. */
export function regionForCountry(country: string | undefined | null): RegionId {
  if (!country) return DEFAULT_REGION;
  return country.toUpperCase() === "IN" ? "in" : "intl";
}
