"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { StatusStepper } from "@/components/order/StatusStepper";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { useRegion } from "@/lib/region-context";
import type { OrderStatus, RegionId } from "@/lib/types";
import { Search, Package, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FetchedOrder {
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
}

type TrackState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "found"; order: FetchedOrder }
  | { phase: "not_found"; code: string }
  | { phase: "error" };

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchOrder(code: string): Promise<FetchedOrder | null> {
  const res = await fetch(`/api/orders?code=${encodeURIComponent(code.trim())}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { ok: boolean; order?: FetchedOrder };
  if (!json.ok || !json.order) return null;
  return json.order;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TrackClient() {
  const region = useRegion();
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("id") ?? "";

  const [input, setInput] = useState(prefilled);
  const [state, setState] = useState<TrackState>({ phase: "idle" });
  const [isPending, startTransition] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-track if ?id= is provided
  useEffect(() => {
    if (prefilled.trim()) {
      handleTrack(prefilled.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrack(codeOverride?: string) {
    const code = (codeOverride ?? input).trim();
    if (!code) return;

    setState({ phase: "loading" });

    startTransition(async () => {
      try {
        const order = await fetchOrder(code);
        if (!order) {
          setState({ phase: "not_found", code });
        } else {
          setState({ phase: "found", order });
          // Scroll result into view after render
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
      } catch {
        setState({ phase: "error" });
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleTrack();
  }

  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <span
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-paper-2"
            aria-hidden="true"
          >
            <Package size={28} className="text-tomato" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold md:text-3xl">
            Track your order
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Enter your order code — it looks like{" "}
            <span className="font-mono text-ink">CHOP-XXXXX-1234</span>
          </p>
        </div>

        {/* ── Form ───────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row"
          aria-label="Order tracking form"
        >
          <label htmlFor="order-code" className="sr-only">
            Order code
          </label>
          <input
            id="order-code"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="CHOP-XXXXX-1234"
            autoComplete="off"
            spellCheck={false}
            className="h-12 flex-1 rounded-full border border-line bg-paper px-5 font-mono text-sm placeholder:text-ink-soft/50 focus:border-tomato focus:outline-none focus:ring-2 focus:ring-tomato/20"
            aria-required="true"
            aria-label="Order code"
            disabled={state.phase === "loading" || isPending}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || state.phase === "loading" || isPending}
            className="h-12 gap-2 rounded-full px-6"
          >
            <Search size={16} aria-hidden="true" />
            {state.phase === "loading" || isPending ? "Tracking…" : "Track"}
          </Button>
        </form>

        {/* ── Results area ───────────────────────────────────────────── */}
        <div
          ref={resultRef}
          className="mt-8"
          aria-live="polite"
          aria-atomic="true"
          role="region"
          aria-label="Tracking result"
        >
          {/* Loading skeleton */}
          {(state.phase === "loading" || isPending) && (
            <div
              className="space-y-4 animate-pulse motion-reduce:animate-none"
              aria-label="Loading order details"
            >
              <div className="h-4 w-2/3 rounded-full bg-paper-2" />
              <div className="h-32 rounded-2xl bg-paper-2" />
              <div className="h-24 rounded-2xl bg-paper-2" />
            </div>
          )}

          {/* Not found */}
          {state.phase === "not_found" && (
            <div className="rounded-2xl border border-line bg-paper-2 px-5 py-6 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-ink-soft"
                aria-hidden="true"
              />
              <p className="font-semibold">Order not found</p>
              <p className="mt-1.5 text-sm text-ink-soft">
                No order matched{" "}
                <span className="font-mono text-ink">{state.code}</span>. Check
                the code in your confirmation email or WhatsApp message.
              </p>
            </div>
          )}

          {/* Error */}
          {state.phase === "error" && (
            <div className="rounded-2xl border border-tomato/20 bg-tomato/8 px-5 py-6 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-tomato"
                aria-hidden="true"
              />
              <p className="font-semibold text-tomato">Something went wrong</p>
              <p className="mt-1.5 text-sm text-ink-soft">
                Couldn&apos;t reach our servers. Try again in a moment.
              </p>
              <button
                onClick={() => handleTrack()}
                className="mt-4 text-sm font-semibold text-tomato underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Found */}
          {state.phase === "found" && (
            <div className="space-y-6">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  Order{" "}
                  <span className="font-mono text-sm font-normal text-ink-soft">
                    {state.order.code}
                  </span>
                </h2>
                <StatusBadge status={state.order.status} />
              </div>

              {/* Stepper */}
              <section aria-label="Order progress">
                <StatusStepper status={state.order.status} />
              </section>

              {/* Shipping line */}
              {state.order.status !== "cancelled" &&
                state.order.status !== "refunded" && (
                  <div className="rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink-soft">
                    <Package
                      size={14}
                      className="mr-1.5 inline-block align-middle"
                      aria-hidden="true"
                    />
                    {region.shippingCopy}
                  </div>
                )}

              {/* Summary card */}
              <section aria-label="Order details">
                <OrderSummaryCard order={state.order} />
              </section>

              {/* Re-track button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setState({ phase: "idle" });
                    setInput("");
                  }}
                  className="text-sm text-ink-soft underline-offset-2 hover:underline"
                >
                  Track a different order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

// ── Status badge chip ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  cod_confirmed: "COD confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_TONE: Record<
  OrderStatus,
  "mint" | "tomato" | "marigold" | "neutral"
> = {
  pending: "marigold",
  paid: "mint",
  cod_confirmed: "mint",
  shipped: "marigold",
  delivered: "mint",
  cancelled: "tomato",
  refunded: "neutral",
};

const TONE_CLASSES = {
  mint: "bg-mint/15 text-mint-d",
  tomato: "bg-tomato/12 text-tomato",
  marigold: "bg-marigold/20 text-ink",
  neutral: "bg-ink/8 text-ink-soft",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
