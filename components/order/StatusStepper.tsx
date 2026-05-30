import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { Check, X, RotateCcw } from "lucide-react";

// ── Step definition ─────────────────────────────────────────────────────────
// Maps the happy-path status progression to ordered steps.
// cancelled / refunded are terminal aberrations handled separately.

export interface Step {
  key: string;
  label: string;
  sublabel: string;
}

const STEPS: Step[] = [
  {
    key: "placed",
    label: "Order placed",
    sublabel: "We received your order",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    sublabel: "Payment verified or COD accepted",
  },
  {
    key: "shipped",
    label: "Shipped",
    sublabel: "On its way to you",
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "Enjoy your CHOP.",
  },
];

// Maps each OrderStatus to how far along the stepper we are:
// -1 = terminal / aberrant; 0–3 = last completed step index
const STATUS_STEP_INDEX: Record<OrderStatus, number> = {
  pending:       0, // placed, nothing confirmed yet
  paid:          1, // payment confirmed
  cod_confirmed: 1, // COD confirmed
  shipped:       2, // shipped
  delivered:     3, // delivered
  cancelled:    -1,
  refunded:     -1,
};

type StepState = "done" | "active" | "upcoming";

function stepState(stepIndex: number, activeIndex: number): StepState {
  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "active";
  return "upcoming";
}

// ── Component ────────────────────────────────────────────────────────────────

export function StatusStepper({ status }: { status: OrderStatus }) {
  const isTerminal = status === "cancelled" || status === "refunded";
  const activeIndex = STATUS_STEP_INDEX[status];

  if (isTerminal) {
    return <TerminalBanner status={status} />;
  }

  return (
    <div
      className="relative"
      role="list"
      aria-label="Order status"
    >
      {/* Connector track */}
      <div
        className="absolute left-[19px] top-8 h-[calc(100%-2rem)] w-px bg-line md:left-1/2 md:top-5 md:h-px md:w-[calc(100%-3.5rem)]"
        aria-hidden="true"
      />

      <ol className="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        {STEPS.map((step, i) => {
          const state = stepState(i, activeIndex);
          return (
            <li
              key={step.key}
              role="listitem"
              className="relative flex items-start gap-4 md:flex-1 md:flex-col md:items-center md:text-center"
            >
              {/* Circle */}
              <span
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 motion-reduce:transition-none",
                  state === "done" &&
                    "border-mint bg-mint text-paper",
                  state === "active" &&
                    "border-tomato bg-tomato text-paper shadow-[0_0_0_4px_rgba(194,74,45,0.15)]",
                  state === "upcoming" &&
                    "border-line bg-paper text-ink-soft",
                )}
                aria-current={state === "active" ? "step" : undefined}
              >
                {state === "done" ? (
                  <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      state === "active" ? "text-paper" : "text-ink-soft",
                    )}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                )}
              </span>

              {/* Labels */}
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    state === "active" && "text-tomato",
                    state === "done" && "text-ink",
                    state === "upcoming" && "text-ink-soft",
                  )}
                >
                  {step.label}
                </span>
                {state !== "upcoming" && (
                  <span className="text-xs text-ink-soft">{step.sublabel}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Terminal state banner ────────────────────────────────────────────────────

function TerminalBanner({ status }: { status: "cancelled" | "refunded" }) {
  const isCancelled = status === "cancelled";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-5 py-4",
        isCancelled
          ? "border-tomato/20 bg-tomato/8 text-tomato"
          : "border-line bg-paper-2 text-ink-soft",
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isCancelled ? "bg-tomato/15" : "bg-ink/8",
        )}
      >
        {isCancelled ? (
          <X size={18} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" />
        )}
      </span>
      <div>
        <p className="font-semibold">
          {isCancelled ? "Order cancelled" : "Refund initiated"}
        </p>
        <p className="mt-0.5 text-sm">
          {isCancelled
            ? "This order has been cancelled. If you were charged, expect a refund within 5–7 business days."
            : "Your refund is being processed and will reach your original payment method within 5–7 business days."}
        </p>
      </div>
    </div>
  );
}
