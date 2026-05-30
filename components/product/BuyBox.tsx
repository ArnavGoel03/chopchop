"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap, Truck, Banknote, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { useCart } from "@/lib/cart/store";
import { useRegion, useRegionHref } from "@/lib/region-context";
import type { Product, ProductVariant } from "@/lib/types";

interface BuyBoxProps {
  product: Product;
}

export function BuyBox({ product }: BuyBoxProps) {
  const region = useRegion();
  const regionHref = useRegionHref();
  const router = useRouter();
  const cart = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0].id
  );
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const variant: ProductVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];

  const currentPrice = variant.price[region.id];
  const currentCompareAt = variant.compareAt?.[region.id];

  const decrementQty = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const incrementQty = useCallback(() => setQty((q) => Math.min(10, q + 1)), []);

  const handleAdd = useCallback(() => {
    cart.add({ productSlug: product.slug, variantId: variant.id, qty });
    setAddedToCart(true);
    const timer = setTimeout(() => setAddedToCart(false), 2500);
    return () => clearTimeout(timer);
  }, [cart, product.slug, variant.id, qty]);

  const handleBuyNow = useCallback(() => {
    cart.add({ productSlug: product.slug, variantId: variant.id, qty });
    router.push(regionHref("/checkout"));
  }, [cart, product.slug, variant.id, qty, router, regionHref]);

  // Inventory cue
  const inventory = variant.inventory;
  const inventoryCue =
    inventory === null
      ? null
      : inventory <= 20
        ? { label: `Only ${inventory} left`, urgent: true }
        : inventory <= 50
          ? { label: `${inventory} in stock`, urgent: false }
          : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      <Price
        amount={currentPrice}
        compareAt={currentCompareAt}
        region={region.id}
        size="lg"
      />

      {/* Variant picker */}
      {product.variants.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
            Option
          </span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select variant">
            {product.variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                    isSelected
                      ? "border-tomato bg-tomato text-white"
                      : "border-line bg-paper-2 text-ink hover:border-ink"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          {variant.note && (
            <p className="text-xs text-ink-soft">{variant.note}</p>
          )}
        </div>
      )}

      {/* Qty stepper */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
          Quantity
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={decrementQty}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-paper-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          >
            <Minus size={14} />
          </button>
          <span
            className="min-w-[2rem] text-center text-base font-semibold tabular-nums"
            aria-live="polite"
            aria-label={`Quantity: ${qty}`}
          >
            {qty}
          </span>
          <button
            onClick={incrementQty}
            disabled={qty >= 10}
            aria-label="Increase quantity"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-paper-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Inventory cue */}
      {inventoryCue && (
        <p
          className={`text-sm font-medium ${
            inventoryCue.urgent ? "text-tomato" : "text-ink-soft"
          }`}
          aria-live="polite"
        >
          {inventoryCue.urgent ? "⚡ " : ""}
          {inventoryCue.label}
        </p>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        {/* Add to cart with inline confirmation */}
        <div className="relative">
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            onClick={handleAdd}
            aria-label={addedToCart ? "Added to cart" : "Add to cart"}
          >
            {addedToCart ? (
              <>
                <CheckCircle2 size={18} />
                Added to cart
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Add to cart
              </>
            )}
          </Button>
          {/* Inline confirmation flash */}
          {addedToCart && (
            <div
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper shadow-pop"
              role="status"
              aria-live="polite"
            >
              {qty} × {variant.label} added
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="lg"
          className="w-full gap-2"
          onClick={handleBuyNow}
          aria-label="Buy now — go to checkout"
        >
          <Zap size={18} />
          Buy now
        </Button>
      </div>

      {/* Shipping / trust strip */}
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-2 px-4 py-3">
        <div className="flex items-start gap-2.5 text-sm text-ink-soft">
          <Truck size={15} className="mt-0.5 shrink-0 text-mint" aria-hidden />
          <span>{region.shippingCopy}</span>
        </div>
        {region.codAvailable && (
          <div className="flex items-start gap-2.5 text-sm text-ink-soft">
            <Banknote size={15} className="mt-0.5 shrink-0 text-marigold" aria-hidden />
            <span>
              Cash on delivery available · {" "}
              <span className="text-ink font-medium">
                ₹{region.codFee / 100} COD fee
              </span>
            </span>
          </div>
        )}
        <div className="flex items-start gap-2.5 text-sm text-ink-soft">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-mint" aria-hidden />
          <span>1-year warranty · hassle-free returns</span>
        </div>
      </div>
    </div>
  );
}
