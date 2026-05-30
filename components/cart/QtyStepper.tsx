"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QtyStepperProps {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QtyStepper({
  qty,
  onDecrement,
  onIncrement,
  min = 1,
  max = 99,
  className,
}: QtyStepperProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0 rounded-full border border-line bg-paper-2",
        className,
      )}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={qty <= min}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span
        className="min-w-[2rem] text-center text-[15px] font-semibold tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={qty >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
