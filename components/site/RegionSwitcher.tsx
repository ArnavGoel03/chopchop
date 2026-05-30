"use client";

import { usePathname, useRouter } from "next/navigation";
import { REGIONS, REGION_IDS } from "@/lib/regions";
import type { RegionId } from "@/lib/types";
import { useRegion } from "@/lib/region-context";

const FLAG: Record<RegionId, string> = { in: "🇮🇳", intl: "🌍" };

export function RegionSwitcher() {
  const region = useRegion();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: RegionId) {
    if (next === region.id) return;
    const rest = pathname.replace(/^\/(in|intl)/, "");
    router.push(`/${next}${rest || ""}`);
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-line bg-paper p-0.5 text-xs">
      {REGION_IDS.map((id) => (
        <button
          key={id}
          onClick={() => switchTo(id)}
          aria-pressed={region.id === id}
          className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${
            region.id === id
              ? "bg-ink text-paper"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {FLAG[id]} {REGIONS[id].currency}
        </button>
      ))}
    </div>
  );
}
