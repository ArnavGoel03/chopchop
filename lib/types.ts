// ─────────────────────────────────────────────────────────────────────────
// Core domain types — the contract the whole app builds against.
// Prices are ALWAYS stored as integer minor units (paise for INR, cents for
// USD) to avoid floating-point money bugs. Format with lib/money.ts.
// ─────────────────────────────────────────────────────────────────────────

export type RegionId = "in" | "intl";

export type PaymentProvider = "razorpay" | "stripe";

export interface Region {
  id: RegionId;
  /** URL segment, e.g. /in or /intl */
  segment: string;
  label: string;
  /** ISO 4217 */
  currency: string;
  currencySymbol: string;
  /** BCP-47 for Intl formatting */
  locale: string;
  paymentProvider: PaymentProvider;
  codAvailable: boolean;
  /** Free shipping at/above this order subtotal (minor units). 0 = always free. */
  freeShipThreshold: number;
  /** Flat shipping fee below threshold (minor units). */
  flatShipping: number;
  /** COD handling fee (minor units). */
  codFee: number;
  /** Tax label shown at checkout, e.g. "GST" / "VAT / Duties". */
  taxLabel: string;
  /** Human shipping-time copy. */
  shippingCopy: string;
  /** Default country code for phone/address. */
  defaultCountry: string;
}

/** Per-region price map. Keys are RegionId, values are minor units. */
export type RegionPrice = Record<RegionId, number>;

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  /** Multiplier-free explicit price per region (minor units). */
  price: RegionPrice;
  compareAt?: RegionPrice;
  /** Stock count; null = made-to-order / unlimited. */
  inventory: number | null;
  /** Short note, e.g. "Two units — one for amma". */
  note?: string;
}

export interface ProductFeature {
  icon: string;
  title: string;
  body: string;
}

export interface ProductReview {
  author: string;
  location: string;
  rating: number;
  body: string;
  verified: boolean;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  category: ProductCategory;
  /** Headline base price per region (minor units) — usually the first variant. */
  price: RegionPrice;
  compareAt?: RegionPrice;
  badges: string[];
  /** Long-form HTML-free description paragraphs. */
  description: string[];
  features: ProductFeature[];
  specs: Record<string, string>;
  variants: ProductVariant[];
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
  /** Hero accent token name from the palette, e.g. "tomato" | "marigold". */
  accent: string;
  /** Whether to surface on the homepage hero. */
  featured: boolean;
}

export type ProductCategory =
  | "choppers"
  | "prep"
  | "cookware"
  | "storage"
  | "bundles";

export interface Category {
  id: ProductCategory;
  label: string;
  blurb: string;
}

// ── Cart ───────────────────────────────────────────────────────────────────

export interface CartLine {
  productSlug: string;
  variantId: string;
  qty: number;
}

export interface ResolvedCartLine extends CartLine {
  product: Product;
  variant: ProductVariant;
  /** Unit price in the active region (minor units). */
  unitPrice: number;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  codFee: number;
  discount: number;
  total: number;
  currency: string;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "cod_confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "online" | "cod";

export interface OrderItemSnapshot {
  productSlug: string;
  name: string;
  variantId: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
}
