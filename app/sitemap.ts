import type { MetadataRoute } from "next";
import { REGION_IDS } from "@/lib/regions";
import { allProducts, CATEGORIES } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

const LEGAL_SLUGS = ["privacy", "terms", "shipping", "returns", "track"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const region of REGION_IDS) {
    // Home
    entries.push({
      url: absoluteUrl(`/${region}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: region === "in" ? 1.0 : 0.9,
    });

    // Shop index
    entries.push({
      url: absoluteUrl(`/${region}/shop`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });

    // Categories
    for (const cat of CATEGORIES) {
      entries.push({
        url: absoluteUrl(`/${region}/shop?category=${cat.id}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Products
    for (const product of allProducts()) {
      entries.push({
        url: absoluteUrl(`/${region}/products/${product.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    // Legal & informational pages
    for (const slug of LEGAL_SLUGS) {
      entries.push({
        url: absoluteUrl(`/${region}/${slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
  }

  return entries;
}
