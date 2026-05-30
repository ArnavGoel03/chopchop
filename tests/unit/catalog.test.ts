import { describe, it, expect } from "vitest";
import {
  getProduct,
  getVariant,
  productsByCategory,
  relatedProducts,
  featuredProducts,
  allProducts,
  PRODUCTS,
  CATEGORIES,
} from "@/lib/catalog";
import type { ProductCategory } from "@/lib/types";

const VALID_CATEGORIES: ProductCategory[] = [
  "choppers",
  "prep",
  "cookware",
  "storage",
  "bundles",
];

describe("getProduct", () => {
  it("returns the correct product by slug", () => {
    const p = getProduct("5-blade-chopper");
    expect(p).toBeDefined();
    expect(p!.name).toBe("CHOP. 5-Blade Chopper");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProduct("non-existent-slug")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getProduct("")).toBeUndefined();
  });

  it("finds all known catalog slugs", () => {
    const expectedSlugs = [
      "5-blade-chopper",
      "rapid-peeler",
      "mandoline-slicer",
      "spice-grinder",
      "nonstick-kadhai",
      "airtight-canister-set",
    ];
    for (const slug of expectedSlugs) {
      expect(getProduct(slug)).toBeDefined();
    }
  });
});

describe("getVariant", () => {
  it("returns the correct variant when id matches", () => {
    const p = getProduct("5-blade-chopper")!;
    const v = getVariant(p, "family");
    expect(v.id).toBe("family");
    expect(v.sku).toBe("CHOP-CHP-2");
  });

  it("falls back to the first variant when id is not found", () => {
    const p = getProduct("5-blade-chopper")!;
    const v = getVariant(p, "does-not-exist");
    expect(v.id).toBe(p.variants[0].id);
  });

  it("falls back to first variant for empty string id", () => {
    const p = getProduct("rapid-peeler")!;
    const v = getVariant(p, "");
    expect(v.id).toBe(p.variants[0].id);
  });

  it("returns the only variant for single-variant products", () => {
    const p = getProduct("mandoline-slicer")!;
    expect(p.variants).toHaveLength(1);
    const v = getVariant(p, "single");
    expect(v.id).toBe("single");
  });

  it("returns first variant when requesting a non-existent id on single-variant product", () => {
    const p = getProduct("mandoline-slicer")!;
    const v = getVariant(p, "large");
    expect(v.id).toBe("single");
  });
});

describe("productsByCategory", () => {
  it("returns only choppers", () => {
    const products = productsByCategory("choppers");
    expect(products.length).toBeGreaterThan(0);
    products.forEach((p) => expect(p.category).toBe("choppers"));
  });

  it("returns only prep products", () => {
    const products = productsByCategory("prep");
    expect(products.length).toBeGreaterThan(0);
    products.forEach((p) => expect(p.category).toBe("prep"));
  });

  it("returns empty array for a category with no products (bundles)", () => {
    const products = productsByCategory("bundles");
    expect(products).toEqual([]);
  });

  it("returns cookware products", () => {
    const products = productsByCategory("cookware");
    expect(products.length).toBeGreaterThan(0);
    products.forEach((p) => expect(p.category).toBe("cookware"));
  });

  it("returns storage products", () => {
    const products = productsByCategory("storage");
    expect(products.length).toBeGreaterThan(0);
    products.forEach((p) => expect(p.category).toBe("storage"));
  });
});

describe("relatedProducts", () => {
  it("excludes the source product itself", () => {
    const related = relatedProducts("5-blade-chopper");
    const self = related.find((p) => p.slug === "5-blade-chopper");
    expect(self).toBeUndefined();
  });

  it("respects the default limit of 4", () => {
    const related = relatedProducts("5-blade-chopper");
    expect(related.length).toBeLessThanOrEqual(4);
  });

  it("respects a custom limit", () => {
    const related = relatedProducts("5-blade-chopper", 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it("respects limit=1", () => {
    const related = relatedProducts("5-blade-chopper", 1);
    expect(related.length).toBeLessThanOrEqual(1);
  });

  it("returns products for an unknown slug (falls back to first N products)", () => {
    const related = relatedProducts("unknown-slug", 4);
    expect(related.length).toBeLessThanOrEqual(4);
  });

  it("prefers same-category products", () => {
    // rapid-peeler is in 'prep'; should see other prep products first
    const related = relatedProducts("rapid-peeler", 4);
    const sourceProduct = getProduct("rapid-peeler")!;
    const sameCategory = related.filter(
      (p) => p.category === sourceProduct.category
    );
    // There should be some same-category products in the related list
    expect(sameCategory.length).toBeGreaterThan(0);
  });

  it("limit=0 returns empty array", () => {
    const related = relatedProducts("5-blade-chopper", 0);
    expect(related).toEqual([]);
  });
});

describe("featuredProducts", () => {
  it("returns only featured products", () => {
    const featured = featuredProducts();
    expect(featured.length).toBeGreaterThan(0);
    featured.forEach((p) => expect(p.featured).toBe(true));
  });

  it("does NOT include non-featured products", () => {
    const featured = featuredProducts();
    const featuredSlugs = new Set(featured.map((p) => p.slug));
    const nonFeatured = PRODUCTS.filter((p) => !p.featured);
    nonFeatured.forEach((p) => {
      expect(featuredSlugs.has(p.slug)).toBe(false);
    });
  });

  it("5-blade-chopper is featured", () => {
    const featured = featuredProducts();
    const chopper = featured.find((p) => p.slug === "5-blade-chopper");
    expect(chopper).toBeDefined();
  });
});

describe("allProducts", () => {
  it("returns a non-empty array", () => {
    expect(allProducts().length).toBeGreaterThan(0);
  });

  it("matches the PRODUCTS export length", () => {
    expect(allProducts()).toHaveLength(PRODUCTS.length);
  });
});

// ── DATA INTEGRITY ───────────────────────────────────────────────────────────

describe("Catalog data integrity", () => {
  it("every product has a price for BOTH regions (in and intl)", () => {
    PRODUCTS.forEach((p) => {
      expect(typeof p.price.in, `${p.slug} missing in price`).toBe("number");
      expect(typeof p.price.intl, `${p.slug} missing intl price`).toBe(
        "number"
      );
      expect(p.price.in, `${p.slug} in price should be > 0`).toBeGreaterThan(0);
      expect(
        p.price.intl,
        `${p.slug} intl price should be > 0`
      ).toBeGreaterThan(0);
    });
  });

  it("every variant has prices for BOTH regions", () => {
    PRODUCTS.forEach((p) => {
      p.variants.forEach((v) => {
        expect(
          typeof v.price.in,
          `${p.slug}/${v.id} missing in variant price`
        ).toBe("number");
        expect(
          typeof v.price.intl,
          `${p.slug}/${v.id} missing intl variant price`
        ).toBe("number");
        expect(v.price.in, `${p.slug}/${v.id} in variant price should be > 0`).toBeGreaterThan(0);
        expect(v.price.intl, `${p.slug}/${v.id} intl variant price should be > 0`).toBeGreaterThan(0);
      });
    });
  });

  it("product slugs are unique", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("all product ratings are within 0–5", () => {
    PRODUCTS.forEach((p) => {
      expect(p.rating, `${p.slug} rating out of range`).toBeGreaterThanOrEqual(0);
      expect(p.rating, `${p.slug} rating out of range`).toBeLessThanOrEqual(5);
    });
  });

  it("all products have a valid ProductCategory", () => {
    PRODUCTS.forEach((p) => {
      expect(
        VALID_CATEGORIES,
        `${p.slug} has invalid category: ${p.category}`
      ).toContain(p.category);
    });
  });

  it("all variant IDs are unique within a product", () => {
    PRODUCTS.forEach((p) => {
      const ids = p.variants.map((v) => v.id);
      const unique = new Set(ids);
      expect(
        unique.size,
        `${p.slug} has duplicate variant IDs`
      ).toBe(ids.length);
    });
  });

  it("all products have at least one variant", () => {
    PRODUCTS.forEach((p) => {
      expect(
        p.variants.length,
        `${p.slug} has no variants`
      ).toBeGreaterThan(0);
    });
  });

  it("all variant SKUs are non-empty strings", () => {
    PRODUCTS.forEach((p) => {
      p.variants.forEach((v) => {
        expect(
          typeof v.sku,
          `${p.slug}/${v.id} sku should be string`
        ).toBe("string");
        expect(
          v.sku.length,
          `${p.slug}/${v.id} sku should be non-empty`
        ).toBeGreaterThan(0);
      });
    });
  });

  it("every CATEGORY id that appears in products exists in CATEGORIES", () => {
    const categoryIds = new Set(CATEGORIES.map((c) => c.id));
    PRODUCTS.forEach((p) => {
      expect(
        categoryIds.has(p.category),
        `${p.slug} references category '${p.category}' not found in CATEGORIES`
      ).toBe(true);
    });
  });

  it("product compareAt prices are greater than base prices when present (IN)", () => {
    PRODUCTS.forEach((p) => {
      if (p.compareAt) {
        expect(
          p.compareAt.in,
          `${p.slug} compareAt.in should be > price.in`
        ).toBeGreaterThan(p.price.in);
      }
    });
  });

  it("product compareAt prices are greater than base prices when present (intl)", () => {
    PRODUCTS.forEach((p) => {
      if (p.compareAt) {
        expect(
          p.compareAt.intl,
          `${p.slug} compareAt.intl should be > price.intl`
        ).toBeGreaterThan(p.price.intl);
      }
    });
  });
});
