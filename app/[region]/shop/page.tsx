import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isRegionId, getRegion, REGION_IDS } from "@/lib/regions";
import { allProducts } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { ProductGrid } from "@/components/shop/ProductGrid";

export function generateStaticParams() {
  return REGION_IDS.map((region) => ({ region }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: seg } = await params;
  if (!isRegionId(seg)) return {};
  const region = getRegion(seg);
  return {
    title:
      region.id === "in"
        ? "Shop All Kitchen Tools — CHOP."
        : "Shop All Products — CHOP.",
    description:
      region.id === "in"
        ? "Choppers, prep tools, cookware and storage for Indian kitchens. Free delivery. COD available."
        : "Manual choppers, prep tools, cookware and storage. Worldwide shipping.",
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: seg } = await params;
  if (!isRegionId(seg)) notFound();
  const region = getRegion(seg);
  const products = allProducts();

  return (
    <div className="py-12">
      <Container>
        {/* Page header */}
        <header className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato">
            The full range
          </span>
          <h1 className="display mt-2 text-4xl font-semibold md:text-5xl">
            Everything we{" "}
            <em className="font-display italic text-tomato">make.</em>
          </h1>
          <p className="mt-3 text-ink-soft">
            {products.length} products · {region.shippingCopy}
          </p>
        </header>

        {/* Category filter */}
        <div className="mb-10">
          <CategoryNav region={region.id} />
        </div>

        {/* Grid */}
        <ProductGrid products={products} region={region.id} />
      </Container>
    </div>
  );
}
