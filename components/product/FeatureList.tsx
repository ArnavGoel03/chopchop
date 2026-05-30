import { FeatureIcon } from "@/components/ui/FeatureIcon";
import type { ProductFeature } from "@/lib/types";

export function FeatureList({ features }: { features: ProductFeature[] }) {
  return (
    <section aria-label="Product features">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex gap-4 rounded-2xl border border-line bg-paper-2 p-5 transition-shadow hover:shadow-card"
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper border border-line">
              <FeatureIcon name={f.icon} size={20} className="text-tomato" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
