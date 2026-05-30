import type { Product } from "@/lib/types";
import type { RegionId } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  region,
}: {
  products: Product[];
  region: RegionId;
}) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center text-ink-soft">
        <p className="font-display text-2xl italic">Nothing here yet.</p>
        <p className="mt-2 text-sm">Check back soon — new drops incoming.</p>
      </div>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} region={region} />
        </li>
      ))}
    </ul>
  );
}
