import type { RegionId } from "./types";
import { REGIONS } from "./regions";

// ── FAQ items ─────────────────────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_IN: FaqItem[] = [
  {
    id: "what-is-chop",
    question: "What exactly is the CHOP. 5-Blade Chopper?",
    answer:
      "It is a pull-cord manual chopper with five cross-arranged Japanese stainless blades. One firm pull spins the blades at ~1,000 rpm inside a 900 ml BPA-free bowl. Onions, tomatoes, coriander, green chilli — prep in under ten seconds. No plug, no battery.",
  },
  {
    id: "shipping-india",
    question: "How long does delivery take? Is it free?",
    answer:
      "Shipping is free across India. Metro cities (Mumbai, Delhi, Bengaluru, Chennai, Hyderabad) get it in 3–5 working days. Tier 2 cities in 5–6 days. Rural and Northeast India in 6–9 days. We dispatch the same day for orders placed before 6 PM IST on working days.",
  },
  {
    id: "cod",
    question: "Is Cash on Delivery available?",
    answer:
      "Yes, COD is available across 25,000+ pincodes for a ₹50 handling fee. Our team confirms every COD order by WhatsApp before we dispatch, so you know it is genuine.",
  },
  {
    id: "returns-india",
    question: "What if I want to return it?",
    answer:
      "WhatsApp us within 7 days of delivery with your order ID. We arrange free pickup. Your refund (to UPI, card, or bank account for COD) lands within 48 hours of us receiving the product back.",
  },
  {
    id: "warranty",
    question: "What does the 1-year warranty cover?",
    answer:
      "It covers manufacturing defects — blade chipping, body cracks, and mechanism failure. Send a photo via WhatsApp and we replace the part or unit free. It does not cover damage from chopping ice, frozen food, or hard nuts.",
  },
  {
    id: "dishwasher",
    question: "Can I put it in the dishwasher?",
    answer:
      "Yes. The bowl, blade unit, and lid all detach in three parts and are dishwasher safe. Top rack recommended. Hand-rinse right after chopping is even quicker — about thirty seconds under the tap.",
  },
  {
    id: "capacity",
    question: "How much can it chop at once?",
    answer:
      "The bowl holds 900 ml. That is enough for two large onions, a bunch of coriander, or a full salad serving for four. For larger quantities, do two pulls and empty between them.",
  },
  {
    id: "payment-methods",
    question: "What payment options do you accept?",
    answer:
      "UPI (PhonePe, GPay, Paytm, BHIM), debit cards, credit cards, net banking, wallets, and EMI via Razorpay. All major Indian banks and cards supported. Plus Cash on Delivery across 25,000+ pincodes.",
  },
];

const FAQ_INTL: FaqItem[] = [
  {
    id: "what-is-chop",
    question: "What is the CHOP. 5-Blade Chopper?",
    answer:
      "A pull-cord manual kitchen chopper with five cross-arranged Japanese stainless-steel blades in a 900 ml BPA-free bowl. One firm pull chops onions, herbs, salad, and soft vegetables in under ten seconds. No electricity, no batteries — it works anywhere.",
  },
  {
    id: "shipping-intl",
    question: "Where do you ship, and how long does it take?",
    answer:
      "We ship to most countries worldwide from Bengaluru, India. Estimated delivery is 7–14 business days, tracked and insured. Orders over $50 ship free; under $50 a flat $9 fee applies. Tracking is emailed to you within 24 hours of dispatch.",
  },
  {
    id: "duties",
    question: "Will I have to pay customs duties or VAT?",
    answer:
      "Possibly, depending on your country's import rules. We ship with accurate commercial invoices and do not mark shipments as gifts. Import duties and local VAT at destination are the buyer's responsibility. Check your country's import thresholds before ordering.",
  },
  {
    id: "returns-intl",
    question: "What is your return policy?",
    answer:
      "14-day returns from the delivery date for unused, undamaged items. Email hello@chop.shop with your order ID. Return shipping is at your cost unless the item is defective or we sent the wrong product. Refund within 5 business days of receiving it back.",
  },
  {
    id: "warranty",
    question: "What does the warranty cover?",
    answer:
      "One year from delivery, covering manufacturing defects — blade chipping, body cracks, and mechanism failure. Not covered: damage from chopping ice, frozen food, or hard nuts. Email a photo of the defect with your order ID and we resolve it.",
  },
  {
    id: "payment-intl",
    question: "What payment methods do you accept?",
    answer:
      "Visa, Mastercard, American Express, Apple Pay, and Google Pay via Stripe. All transactions are in USD. We do not offer COD for international orders.",
  },
  {
    id: "dishwasher",
    question: "Is it dishwasher safe?",
    answer:
      "Yes. The bowl, blade unit, and lid detach in three parts and are all dishwasher safe (top rack). A quick rinse under the tap right after use takes about thirty seconds.",
  },
  {
    id: "capacity",
    question: "How much can it process at once?",
    answer:
      "The bowl holds 900 ml — enough for two large onions, a full herb bunch, or a salad for four. For larger quantities, chop in two batches; it takes about twenty seconds total.",
  },
];

/** Region-aware FAQ list. */
export function faqFor(region: RegionId): FaqItem[] {
  return region === "in" ? FAQ_IN : FAQ_INTL;
}

// ── Trust badges ──────────────────────────────────────────────────────────────

export interface TrustBadge {
  id: string;
  icon: "shield" | "truck" | "star" | "refresh" | "lock" | "zap";
  label: string;
  sublabel: string;
}

const TRUST_IN: TrustBadge[] = [
  {
    id: "free-shipping",
    icon: "truck",
    label: "Free shipping",
    sublabel: "Across India",
  },
  {
    id: "cod",
    icon: "zap",
    label: "Cash on Delivery",
    sublabel: "25,000+ pincodes",
  },
  {
    id: "returns",
    icon: "refresh",
    label: "7-day returns",
    sublabel: "Free pickup",
  },
  {
    id: "warranty",
    icon: "shield",
    label: "1-year warranty",
    sublabel: "Manufacturing defects",
  },
  {
    id: "reviews",
    icon: "star",
    label: "4.8 stars",
    sublabel: "2,400+ verified buyers",
  },
  {
    id: "secure",
    icon: "lock",
    label: "Razorpay secured",
    sublabel: "PCI-DSS Level 1",
  },
];

const TRUST_INTL: TrustBadge[] = [
  {
    id: "worldwide",
    icon: "truck",
    label: "Worldwide shipping",
    sublabel: "7–14 business days",
  },
  {
    id: "free-shipping",
    icon: "zap",
    label: "Free over $50",
    sublabel: "Tracked & insured",
  },
  {
    id: "returns",
    icon: "refresh",
    label: "14-day returns",
    sublabel: "Hassle-free",
  },
  {
    id: "warranty",
    icon: "shield",
    label: "1-year warranty",
    sublabel: "Manufacturing defects",
  },
  {
    id: "reviews",
    icon: "star",
    label: "4.8 stars",
    sublabel: "2,400+ verified buyers",
  },
  {
    id: "secure",
    icon: "lock",
    label: "Stripe secured",
    sublabel: "PCI-DSS Level 1",
  },
];

/** Region-aware trust badge list. */
export function trustBadges(region: RegionId): TrustBadge[] {
  return region === "in" ? TRUST_IN : TRUST_INTL;
}

// ── Hero / marketing snippets ─────────────────────────────────────────────────

export interface HeroSnippet {
  headline: string;
  subheadline: string;
  cta: string;
  shippingLine: string;
}

const HERO_IN: HeroSnippet = {
  headline: "Pull. Chop. Done.",
  subheadline:
    "Prep pyaaz, tamatar, dhaniya, and salad in ten seconds. No electricity. No tears.",
  cta: "Shop now — ₹999",
  shippingLine: REGIONS.in.shippingCopy,
};

const HERO_INTL: HeroSnippet = {
  headline: "Pull. Chop. Done.",
  subheadline:
    "Manual 5-blade chopper that preps onions, herbs, and salads in seconds. No plug needed.",
  cta: "Shop now — from $14.99",
  shippingLine: REGIONS.intl.shippingCopy,
};

/** Region-aware hero snippet. */
export function heroSnippet(region: RegionId): HeroSnippet {
  return region === "in" ? HERO_IN : HERO_INTL;
}
