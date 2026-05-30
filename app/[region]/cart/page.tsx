"use client";

import { use } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { resolveLines, computeTotals } from "@/lib/cart/totals";
import { formatMoney } from "@/lib/money";
import { getRegion, isRegionId } from "@/lib/regions";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { CouponField } from "@/components/cart/CouponField";
import { useState } from "react";
import { notFound } from "next/navigation";

export default function CartPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: seg } = use(params);
  if (!isRegionId(seg)) notFound();

  const region = getRegion(seg);
  const { lines, remove, setQty, clear } = useCart();
  const [coupon, setCoupon] = useState("");

  const resolved = resolveLines(lines, seg);
  const totals = computeTotals(resolved, seg, {
    method: "online",
    couponCode: coupon,
  });

  const isEmpty = resolved.length === 0;

  if (isEmpty) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto max-w-sm space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-paper-2">
            <ShoppingBag size={36} className="text-ink-soft" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
            <p className="text-ink-soft">
              Add something from our range to get started.
            </p>
          </div>
          <ButtonLink href={`/${seg}/shop`} variant="primary" size="lg">
            Shop now
          </ButtonLink>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display mb-8 text-3xl font-bold md:text-4xl">
        Your cart
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* ── Line items ─────────────────────────────────────────────────── */}
        <section aria-label="Cart items" className="space-y-4">
          {resolved.map((line) => {
            const inv = line.variant.inventory;
            const atMax = inv !== null && line.qty >= inv;
            return (
              <article
                key={`${line.productSlug}-${line.variantId}`}
                className="flex gap-4 rounded-2xl border border-line bg-paper-2 p-4 sm:gap-6 sm:p-5"
              >
                {/* Product info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${seg}/product/${line.productSlug}`}
                    className="font-semibold leading-snug hover:text-tomato transition-colors"
                  >
                    {line.product.name}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {line.variant.label}
                    {line.variant.note && ` · ${line.variant.note}`}
                  </p>

                  {/* Qty + remove row */}
                  <div className="mt-3 flex items-center gap-3">
                    <QtyStepper
                      qty={line.qty}
                      max={inv ?? 99}
                      onDecrement={() =>
                        setQty(line.productSlug, line.variantId, line.qty - 1)
                      }
                      onIncrement={() =>
                        setQty(line.productSlug, line.variantId, line.qty + 1)
                      }
                    />
                    {atMax && inv !== null && (
                      <span className="text-[12px] text-tomato">
                        Max {inv} available
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(line.productSlug, line.variantId)}
                      aria-label={`Remove ${line.product.name}`}
                      className="ml-auto text-ink-soft transition-colors hover:text-tomato"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex shrink-0 flex-col items-end justify-between">
                  <span className="font-display text-lg font-bold tabular-nums">
                    {formatMoney(line.lineTotal, seg)}
                  </span>
                  {line.qty > 1 && (
                    <span className="text-[12px] text-ink-soft">
                      {formatMoney(line.unitPrice, seg)} each
                    </span>
                  )}
                </div>
              </article>
            );
          })}

          {/* Clear cart */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clear}
              className="text-[13px] text-ink-soft underline-offset-2 transition-colors hover:text-tomato hover:underline"
            >
              Clear cart
            </button>
          </div>
        </section>

        {/* ── Order summary sidebar ──────────────────────────────────────── */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold">Order summary</h2>

            {/* Coupon */}
            <CouponField
              applied={coupon}
              onApply={setCoupon}
              onRemove={() => setCoupon("")}
            />

            <hr className="border-line" />

            {/* Totals rows */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(totals.subtotal, seg)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Shipping</span>
                <span className="font-semibold tabular-nums">
                  {totals.shipping === 0
                    ? "Free"
                    : formatMoney(totals.shipping, seg)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-mint">
                  <span className="font-medium">Discount ({coupon})</span>
                  <span className="font-semibold tabular-nums">
                    −{formatMoney(totals.discount, seg)}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-line" />

            <div className="flex items-center justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-2xl font-bold tabular-nums">
                {formatMoney(totals.total, seg)}
              </span>
            </div>

            <p className="text-[12px] text-ink-soft">{region.taxLabel}</p>

            {/* CTA */}
            <ButtonLink
              href={`/${seg}/checkout?coupon=${encodeURIComponent(coupon)}`}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Proceed to checkout
              <ArrowRight size={16} />
            </ButtonLink>

            <p className="text-center text-[12px] text-ink-soft">
              {region.shippingCopy}
            </p>
          </div>

          {/* Continue shopping */}
          <ButtonLink
            href={`/${seg}/shop`}
            variant="ghost"
            size="md"
            className="w-full"
          >
            Continue shopping
          </ButtonLink>
        </aside>
      </div>
    </Container>
  );
}
