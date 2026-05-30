import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import type { RegionId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryNav({
  region,
  active,
}: {
  region: RegionId;
  active?: string;
}) {
  return (
    <nav aria-label="Product categories" className="w-full">
      <ul className="flex flex-wrap gap-2" role="list">
        <li>
          <Link
            href={`/${region}/shop`}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              !active
                ? "bg-ink text-paper"
                : "bg-paper-2 text-ink hover:bg-ink hover:text-paper",
            )}
            aria-current={!active ? "page" : undefined}
          >
            All
          </Link>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/${region}/shop/${cat.id}`}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active === cat.id
                  ? "bg-ink text-paper"
                  : "bg-paper-2 text-ink hover:bg-ink hover:text-paper",
              )}
              aria-current={active === cat.id ? "page" : undefined}
            >
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
