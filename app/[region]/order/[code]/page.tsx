import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isRegionId, getRegion } from "@/lib/regions";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { StatusStepper } from "@/components/order/StatusStepper";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import type { OrderStatus, RegionId } from "@/lib/types";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderApiResponse {
  ok: true;
  order: {
    code: string;
    status: OrderStatus;
    region: RegionId;
    total: number;
    currency: string;
    method: "online" | "cod";
    items: Array<{
      productSlug: string;
      name: string;
      variantId: string;
      variantLabel: string;
      qty: number;
      unitPrice: number;
    }>;
    createdAt: string;
  };
}

interface OrderNotFound {
  ok: false;
}

type OrderFetchResult = OrderApiResponse | OrderNotFound;

// ── Data fetch ───────────────────────────────────────────────────────────────

async function fetchOrder(code: string): Promise<OrderFetchResult> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  try {
    const res = await fetch(
      `${base}/api/orders?code=${encodeURIComponent(code)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return { ok: false };
    if (!res.ok) return { ok: false };
    return (await res.json()) as OrderFetchResult;
  } catch {
    return { ok: false };
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Order ${code}`,
    robots: { index: false, follow: false },
  };
}

// ── Copy helpers ─────────────────────────────────────────────────────────────

function nextStepsCopy(method: "online" | "cod", regionId: RegionId) {
  const isCod = method === "cod";
  if (isCod) {
    return {
      headline: "What happens next",
      points: [
        "Our team will call to confirm your delivery address.",
        "Keep cash ready — our delivery partner collects payment at your door.",
        "You can also track your order below or message us on WhatsApp.",
      ],
      cta: {
        label: "Confirm on WhatsApp",
        href: "https://wa.me/919999999999?text=Hi%2C%20I%20placed%20a%20COD%20order%20and%20want%20to%20confirm.",
      },
    };
  }

  const isIntl = regionId === "intl";
  return {
    headline: "What happens next",
    points: [
      "Your payment has been verified.",
      isIntl
        ? "We'll send a tracking link via email once your order ships (usually within 1–2 business days)."
        : "You'll get a tracking link via WhatsApp/SMS once your order ships.",
      isIntl
        ? "Worldwide delivery takes 7–14 business days — fully tracked and insured."
        : "Expect delivery in 3–7 working days.",
    ],
    cta: null,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ region: string; code: string }>;
}) {
  const { region: regionSeg, code } = await params;
  if (!isRegionId(regionSeg)) notFound();
  const region = getRegion(regionSeg);

  const result = await fetchOrder(code);

  if (!result.ok) {
    return (
      <Container className="py-24">
        <div className="mx-auto max-w-md text-center">
          <Package size={48} className="mx-auto mb-5 text-ink-soft" />
          <h1 className="font-display text-2xl font-bold">Order not found</h1>
          <p className="mt-3 text-ink-soft">
            We couldn&apos;t find an order with code{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 text-sm font-mono">
              {code}
            </code>
            . Double-check the link or track your order below.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={`/${regionSeg}/track?id=${encodeURIComponent(code)}`}>
              Track order
            </ButtonLink>
            <ButtonLink href={`/${regionSeg}`} variant="ghost">
              Continue shopping
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  const { order } = result;
  const isFreshOrder =
    order.status === "pending" || order.status === "cod_confirmed";
  const nextSteps = nextStepsCopy(order.method, region.id);
  const isCancelled =
    order.status === "cancelled" || order.status === "refunded";

  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        {/* ── Success header ──────────────────────────────────────────── */}
        {isFreshOrder && !isCancelled && (
          <div className="mb-10 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mint/15">
              <CheckCircle2
                size={36}
                className="text-mint"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold md:text-4xl">
              {order.method === "cod"
                ? "Order received!"
                : "You’re all set!"}
            </h1>
            <p className="mt-2 text-ink-soft">
              {order.method === "cod"
                ? "Your COD order is confirmed. We'll call to schedule delivery."
                : "Payment confirmed. We're packing your order now."}
            </p>
          </div>
        )}

        {!isFreshOrder && !isCancelled && (
          <h1 className="font-display mb-8 text-2xl font-bold md:text-3xl">
            Order status
          </h1>
        )}

        {isCancelled && (
          <h1 className="font-display mb-8 text-2xl font-bold md:text-3xl">
            Order update
          </h1>
        )}

        {/* ── Order code ──────────────────────────────────────────────── */}
        <p className="mb-6 text-center text-sm text-ink-soft">
          Order code{" "}
          <span className="font-mono font-semibold text-ink">{order.code}</span>
        </p>

        {/* ── Status stepper ──────────────────────────────────────────── */}
        <section aria-label="Order progress" className="mb-10">
          <StatusStepper status={order.status} />
        </section>

        {/* ── Shipping copy ───────────────────────────────────────────── */}
        {!isCancelled && (
          <div className="mb-8 rounded-2xl border border-line bg-paper-2 px-5 py-4 text-sm text-ink-soft">
            <Package
              size={16}
              className="mr-1.5 inline-block align-middle"
              aria-hidden="true"
            />
            {region.shippingCopy}
          </div>
        )}

        {/* ── Order summary ───────────────────────────────────────────── */}
        <section aria-label="Order summary" className="mb-10">
          <OrderSummaryCard order={order} />
        </section>

        {/* ── Next steps ──────────────────────────────────────────────── */}
        {!isCancelled && (
          <section
            aria-label="Next steps"
            className="mb-10 rounded-2xl border border-line bg-paper-2 px-5 py-6"
          >
            <h2 className="mb-4 font-semibold">{nextSteps.headline}</h2>
            <ol className="space-y-2" role="list">
              {nextSteps.points.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tomato/12 text-[11px] font-bold text-tomato"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
            {nextSteps.cta && (
              <a
                href={nextSteps.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle size={16} aria-hidden="true" />
                {nextSteps.cta.label}
              </a>
            )}
          </section>
        )}

        {/* ── Footer links ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
          <ButtonLink href={`/${regionSeg}`} variant="ghost" size="sm">
            Continue shopping
          </ButtonLink>
          <Link
            href={`/${regionSeg}/track?id=${encodeURIComponent(order.code)}`}
            className="text-sm text-ink-soft underline-offset-2 hover:underline"
          >
            Track this order later
          </Link>
        </div>
      </div>
    </Container>
  );
}
