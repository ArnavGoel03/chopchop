import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isRegionId, getRegion, REGION_IDS } from "@/lib/regions";
import {
  productsByCategory,
  getCategory,
  CATEGORIES,
} from "@/lib/catalog";
import type { ProductCategory } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { ProductGrid } from "@/components/shop/ProductGrid";

export function generateStaticParams() {
  return REGION_IDS.flatMap((region) =>
    CATEGORIES.map((cat) => ({ region, category: cat.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; category: string }>;
}): Promise<Metadata> {
  const { region: seg, category } = await params;
  if (!isRegionId(seg)) return {};
  const region = getRegion(seg);
  const cat = getCategory(category as ProductCategory);
  if (!cat) return {};

  return {
    title: `${cat.label} — CHOP.`,
    description: `${cat.blurb} ${region.shippingCopy}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>;
}) {
  const { region: seg, category } = await params;

  if (!isRegionId(seg)) notFound();
  const region = getRegion(seg);

  // Validate category
  const cat = getCategory(category as ProductCategory);
  if (!cat) notFound();

  const products = productsByCategory(cat.id);

  return (
    <div className="py-12">
      <Container>
        {/* Page header */}
        <header className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato">
            {cat.label}
          </span>
          <h1 className="display mt-2 text-4xl font-semibold md:text-5xl">
            {cat.label}
          </h1>
          <p className="mt-3 max-w-[60ch] text-ink-soft">{cat.blurb}</p>
        </header>

        {/* Category nav */}
        <div className="mb-10">
          <CategoryNav region={region.id} active={cat.id} />
        </div>

        {/* Grid */}
        <ProductGrid products={products} region={region.id} />
      </Container>
    </div>
  );
}
