"use client";

import { CreditCard, Truck } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";
import type { Region } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface PaymentMethodTabsProps {
  region: Region;
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodTabs({
  region,
  selected,
  onChange,
}: PaymentMethodTabsProps) {
  const tabs: { method: PaymentMethod; label: string; sublabel: string; icon: React.ReactNode }[] =
    [
      {
        method: "online",
        label: "Pay online",
        sublabel:
          region.paymentProvider === "razorpay"
            ? "Cards, UPI, Net Banking, Wallets"
            : "Cards via Stripe",
        icon: <CreditCard size={18} />,
      },
      ...(region.codAvailable
        ? [
            {
              method: "cod" as PaymentMethod,
              label: "Cash on delivery",
              sublabel: `+${formatMoney(region.codFee, region.id)} handling fee`,
              icon: <Truck size={18} />,
            },
          ]
        : []),
    ];

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">
        Payment method
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {tabs.map((tab) => (
          <label
            key={tab.method}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
              selected === tab.method
                ? "border-tomato bg-tomato/5"
                : "border-line bg-paper hover:border-ink/30",
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value={tab.method}
              checked={selected === tab.method}
              onChange={() => onChange(tab.method)}
              className="sr-only"
            />
            <span
              className={cn(
                "shrink-0",
                selected === tab.method ? "text-tomato" : "text-ink-soft",
              )}
            >
              {tab.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-[14px] font-semibold",
                  selected === tab.method ? "text-tomato" : "text-ink",
                )}
              >
                {tab.label}
              </span>
              <span className="block text-[12px] text-ink-soft">
                {tab.sublabel}
              </span>
            </span>
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                selected === tab.method
                  ? "border-tomato bg-tomato"
                  : "border-line",
              )}
            >
              {selected === tab.method && (
                <span className="block h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
