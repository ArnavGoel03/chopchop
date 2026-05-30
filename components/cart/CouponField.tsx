"use client";

import { useState } from "react";
import { Tag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { COUPONS } from "@/lib/cart/totals";
import { cn } from "@/lib/utils";

interface CouponFieldProps {
  applied: string;
  onApply: (code: string) => void;
  onRemove: () => void;
}

export function CouponField({ applied, onApply, onRemove }: CouponFieldProps) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "error">("idle");

  function handleApply() {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      onApply(code);
      setInput("");
      setStatus("idle");
    } else {
      setStatus("error");
    }
  }

  function handleRemove() {
    onRemove();
    setInput("");
    setStatus("idle");
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-mint/50 bg-mint/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-mint-d">
          <CheckCircle2 size={16} />
          <span>{applied} applied</span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove coupon"
          className="text-ink-soft transition-colors hover:text-tomato"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setStatus("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="Coupon code"
            aria-label="Coupon code"
            maxLength={20}
            className={cn(
              "h-10 w-full rounded-full border bg-paper pl-9 pr-3 text-[14px] font-medium tracking-wider placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-tomato",
              status === "error" ? "border-tomato" : "border-line",
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="h-10 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper transition-opacity hover:opacity-80"
        >
          Apply
        </button>
      </div>
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-[13px] text-tomato">
          <AlertCircle size={13} />
          <span>Invalid coupon code</span>
        </div>
      )}
    </div>
  );
}
