import type { Region } from "@/lib/types";
import type { Product } from "@/lib/types";
import { absoluteUrl, SITE_NAME, BUSINESS_NAME, SITE_URL, BUSINESS_EMAIL } from "@/lib/seo";

// ── Component ─────────────────────────────────────────────────────────────────

/** Drop a JSON-LD blob into the document head. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── Builders ──────────────────────────────────────────────────────────────────

export function organizationJsonLd(): Record<string, unknown> {
  const wa = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: BUSINESS_EMAIL,
        ...(wa ? { telephone: `+${wa.replace(/\D/g, "")}` } : {}),
        availableLanguage: ["English", "Hindi"],
        areaServed: ["IN", "Worldwide"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.instagram.com/chop.shop",
      "https://www.facebook.com/chop.shop",
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/in/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(
  product: Product,
  region: Region,
): Record<string, unknown> {
  const priceMinor = product.price[region.id] ?? 0;
  const priceMajor = (priceMinor / 100).toFixed(2);

  const inStock =
    product.variants.some((v) => v.inventory === null || (v.inventory ?? 0) > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.join(" "),
    sku: product.variants[0]?.sku ?? product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    url: absoluteUrl(`/${region.id}/product/${product.slug}`),
    offers: {
      "@type": "Offer",
      priceCurrency: region.currency,
      price: priceMajor,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/${region.id}/product/${product.slug}`),
      seller: {
        "@type": "Organization",
        name: BUSINESS_NAME,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
    review: product.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating.toString(),
        bestRating: "5",
      },
      reviewBody: r.body,
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
