import Link from "next/link";
import type { Product } from "@/lib/types";
import type { RegionId } from "@/lib/types";
import { StarRating } from "@/components/ui/StarRating";
import { Price } from "@/components/ui/Price";
import { Badge } from "@/components/ui/Badge";
import { ProductVisual } from "./ProductVisual";
import { ArrowRight } from "lucide-react";

export function ProductCard({
  product,
  region,
}: {
  product: Product;
  region: RegionId;
}) {
  const href = `/${region}/product/${product.slug}`;
  const initial = product.name.replace(/^CHOP\.\s+/, "")[0] ?? "C";

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
      <Link href={href} className="block focus-visible:outline-none" tabIndex={-1} aria-hidden>
        <ProductVisual
          accent={product.accent}
          initial={initial}
          size="card"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Badges */}
        {product.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((b) => (
              <Badge key={b} tone="tomato" className="text-[10px]">
                {b}
              </Badge>
            ))}
          </div>
        )}

        {/* Name + tagline */}
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight">
            <Link href={href} className="hover:text-tomato focus-visible:outline-tomato focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink-soft leading-snug">{product.tagline}</p>
        </div>

        {/* Rating */}
        <StarRating rating={product.rating} count={product.reviewCount} />

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <Price
            amount={product.price[region]}
            compareAt={product.compareAt?.[region]}
            region={region}
          />
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-[background-color] hover:bg-tomato focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
            aria-label={`View ${product.name}`}
          >
            View <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
