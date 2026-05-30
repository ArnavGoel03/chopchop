import { formatMoney, percentOff } from "@/lib/money";
import type { RegionId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  region,
  className,
  size = "md",
}: {
  amount: number;
  compareAt?: number;
  region: RegionId;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const off = percentOff(amount, compareAt);
  const now = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-display font-semibold", now)}>
        {formatMoney(amount, region)}
      </span>
      {compareAt && off > 0 && (
        <>
          <span className="text-ink-soft text-sm line-through">
            {formatMoney(compareAt, region)}
          </span>
          <span className="rounded bg-marigold px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-ink">
            {off}% OFF
          </span>
        </>
      )}
    </span>
  );
}
