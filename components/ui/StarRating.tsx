import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span className="tracking-[2px] text-marigold" aria-hidden>
        {"★".repeat(full)}
        <span className="text-line">{"★".repeat(5 - full)}</span>
      </span>
      <span className="text-ink-soft">
        <b className="font-semibold text-ink">{rating.toFixed(1)}</b>
        {count != null && ` · ${count.toLocaleString("en-IN")} reviews`}
      </span>
    </span>
  );
}
