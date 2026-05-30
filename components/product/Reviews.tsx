import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { MapPin } from "lucide-react";
import type { ProductReview } from "@/lib/types";

function ReviewCard({ review }: { review: ProductReview }) {
  const isCon = review.rating < 5;
  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5"
      aria-label={`Review by ${review.author}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-ink">{review.author}</span>
            {review.verified && (
              <Badge tone="mint" className="text-[10px]">
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <MapPin size={11} aria-hidden className="shrink-0" />
            <span>{review.location}</span>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <p
        className={`text-sm leading-relaxed ${
          isCon ? "text-ink-soft" : "text-ink"
        }`}
      >
        {isCon && (
          <span className="mr-1 inline-block rounded bg-marigold/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">
            Honest note
          </span>
        )}
        {review.body}
      </p>
    </article>
  );
}

export function Reviews({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
}) {
  return (
    <section aria-label="Customer reviews">
      {/* Aggregate rating */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-paper-2 px-5 py-4">
        <div className="flex flex-col items-center gap-1 pr-4 border-r border-line">
          <span className="font-display text-5xl font-semibold text-ink leading-none">
            {rating.toFixed(1)}
          </span>
          <StarRating rating={rating} />
        </div>
        <div className="text-sm text-ink-soft">
          <p>
            Based on{" "}
            <strong className="text-ink font-semibold">
              {reviewCount.toLocaleString("en-IN")}
            </strong>{" "}
            verified purchases
          </p>
          <p className="mt-0.5 text-xs">
            Reviews include honest feedback — we don&apos;t filter the 4-stars.
          </p>
        </div>
      </div>

      {/* Review cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <ReviewCard key={`${r.author}-${r.rating}`} review={r} />
        ))}
      </div>
    </section>
  );
}
