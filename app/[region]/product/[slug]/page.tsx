import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Price } from "@/components/ui/Price";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/BuyBox";
import { FeatureList } from "@/components/product/FeatureList";
import { Specs } from "@/components/product/Specs";
import { Reviews } from "@/components/product/Reviews";
import {
  getProduct,
  relatedProducts,
  allProducts,
  getVariant,
} from "@/lib/catalog";
import { REGIONS, REGION_IDS, isRegionId, getRegion } from "@/lib/regions";
import { formatMoney, percentOff } from "@/lib/money";
import type { RegionId } from "@/lib/types";

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const products = allProducts();
  return REGION_IDS.flatMap((region) =>
    products.map((p) => ({ region, slug: p.slug }))
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; slug: string }>;
}): Promise<Metadata> {
  const { region: regionSeg, slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };

  const regionId: RegionId = isRegionId(regionSeg) ? regionSeg : "in";
  const region = getRegion(regionId);
  const baseVariant = getVariant(product, product.variants[0].id);
  const price = formatMoney(baseVariant.price[regionId], regionId);
  const off = percentOff(
    baseVariant.price[regionId],
    baseVariant.compareAt?.[regionId]
  );

  const title = `${product.name} — ${product.tagline}`;
  const description = [
    product.description[0],
    off > 0 ? `${off}% off today. ${price}.` : `${price}.`,
    region.shippingCopy,
  ].join(" ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CHOP.",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── Related product card (inline — no external dependency) ────────────────────

function RelatedCard({
  product,
  regionId,
}: {
  product: ReturnType<typeof getProduct> & object;
  regionId: RegionId;
}) {
  if (!product) return null;

  const ACCENT_DOT: Record<string, string> = {
    tomato: "bg-tomato",
    marigold: "bg-marigold",
    mint: "bg-mint",
    melon: "bg-melon",
    ink: "bg-ink",
  };
  const ACCENT_BG: Record<string, string> = {
    tomato: "from-tomato/8",
    marigold: "from-marigold/10",
    mint: "from-mint/8",
    melon: "from-melon/8",
    ink: "from-ink/5",
  };
  const dotClass = ACCENT_DOT[product.accent] ?? "bg-tomato";
  const bgClass = ACCENT_BG[product.accent] ?? "from-tomato/8";
  const letter = product.name.replace(/^CHOP\.\s*/i, "").charAt(0).toUpperCase();
  const region = REGIONS[regionId];
  const v = product.variants[0];
  const off = percentOff(v.price[regionId], v.compareAt?.[regionId]);

  return (
    <Link
      href={`/${region.segment}/product/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-line bg-paper overflow-hidden transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
      aria-label={`View ${product.name}`}
    >
      {/* Thumbnail */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${bgClass} via-paper to-paper py-8`}
        aria-hidden
      >
        <span
          className="font-display text-5xl leading-none text-ink opacity-60 select-none"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
        >
          <em>{letter}</em>
        </span>
        {off > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-marigold px-2 py-0.5 text-[10px] font-bold text-ink">
            {off}% OFF
          </span>
        )}
        <div
          className={`absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full ${dotClass} opacity-50`}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold text-ink line-clamp-1 group-hover:text-tomato transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-ink-soft line-clamp-1">{product.tagline}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-display font-semibold text-base text-ink">
            {formatMoney(v.price[regionId], regionId)}
          </span>
          {v.compareAt?.[regionId] && off > 0 && (
            <span className="text-xs text-ink-soft line-through">
              {formatMoney(v.compareAt[regionId], regionId)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ region: string; slug: string }>;
}) {
  const { region: regionSeg, slug } = await params;
  if (!isRegionId(regionSeg)) notFound();

  const product = getProduct(slug);
  if (!product) notFound();

  const regionId: RegionId = regionSeg;
  const region = getRegion(regionId);
  const related = relatedProducts(slug, 4);
  const baseVariant = getVariant(product, product.variants[0].id);

  return (
    <div className="py-8 md:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-ink-soft">
          <Link
            href={`/${region.segment}`}
            className="hover:text-ink transition-colors"
          >
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/${region.segment}/shop`}
            className="hover:text-ink transition-colors capitalize"
          >
            {product.category}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* ── Hero: two-column ── */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Gallery product={product} />
          </div>

          {/* Right: info + BuyBox */}
          <div className="flex flex-col gap-6">
            {/* Badges */}
            {product.badges.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Product highlights">
                {product.badges.map((b) => (
                  <Badge key={b} tone="tomato">
                    {b}
                  </Badge>
                ))}
              </div>
            )}

            {/* Name + tagline */}
            <div>
              <h1 className="display text-4xl font-semibold text-ink leading-tight">
                {product.name}
              </h1>
              <p className="mt-2 text-lg text-ink-soft leading-snug">
                {product.tagline}
              </p>
            </div>

            {/* Rating */}
            <StarRating
              rating={product.rating}
              count={product.reviewCount}
              className="text-base"
            />

            {/* Description */}
            <div className="flex flex-col gap-3">
              {product.description.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-ink-soft">
                  {para}
                </p>
              ))}
            </div>

            {/* Divider */}
            <hr className="border-line" />

            {/* BuyBox — client component */}
            <BuyBox product={product} />
          </div>
        </div>

        {/* ── Below-fold sections ── */}
        <div className="mt-20 flex flex-col gap-16">
          {/* Features */}
          {product.features.length > 0 && (
            <section>
              <SectionHeader label="Why it works" />
              <FeatureList features={product.features} />
            </section>
          )}

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <section>
              <SectionHeader label="Specifications" />
              <Specs specs={product.specs} />
            </section>
          )}

          {/* Reviews */}
          {product.reviews.length > 0 && (
            <section>
              <SectionHeader label="What buyers say" />
              <Reviews
                reviews={product.reviews}
                rating={product.rating}
                reviewCount={product.reviewCount}
              />
            </section>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <section>
              <SectionHeader label="You may also like" />
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {related.map((p) => (
                  <RelatedCard key={p.slug} product={p} regionId={regionId} />
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <h2 className="font-display text-2xl font-semibold text-ink">{label}</h2>
      <div className="flex-1 border-t border-line" aria-hidden />
    </div>
  );
}
