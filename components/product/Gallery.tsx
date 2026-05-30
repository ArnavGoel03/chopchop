import type { Product } from "@/lib/types";

// Accent → palette token mapping for the gallery hero
const ACCENT_STYLES: Record<
  string,
  { bg: string; glow: string; initial: string; dot: string }
> = {
  tomato: {
    bg: "from-tomato/10 via-paper to-paper",
    glow: "bg-tomato/20",
    initial: "text-tomato",
    dot: "bg-tomato",
  },
  marigold: {
    bg: "from-marigold/15 via-paper to-paper",
    glow: "bg-marigold/20",
    initial: "text-marigold",
    dot: "bg-marigold",
  },
  mint: {
    bg: "from-mint/10 via-paper to-paper",
    glow: "bg-mint/20",
    initial: "text-mint",
    dot: "bg-mint",
  },
  melon: {
    bg: "from-melon/10 via-paper to-paper",
    glow: "bg-melon/20",
    initial: "text-melon",
    dot: "bg-melon",
  },
  ink: {
    bg: "from-ink/6 via-paper to-paper",
    glow: "bg-ink/15",
    initial: "text-ink",
    dot: "bg-ink",
  },
};

const fallback = ACCENT_STYLES.tomato;

function getAccent(accent: string) {
  return ACCENT_STYLES[accent] ?? fallback;
}

// SVG illustration varies by product category
function ProductIllustration({ product }: { product: Product }) {
  const accent = getAccent(product.accent);
  const letter = product.name.replace(/^CHOP\.\s*/i, "").charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center rounded-[24px] bg-gradient-to-br ${accent.bg} border border-line overflow-hidden`}
      style={{ aspectRatio: "1 / 1" }}
      aria-label={`${product.name} product visual`}
      role="img"
    >
      {/* Radial glow */}
      <div
        className={`absolute inset-0 ${accent.glow} blur-[80px] scale-75`}
        aria-hidden
      />

      {/* Decorative ring */}
      <div
        className="absolute inset-8 rounded-full border border-line/40 opacity-60"
        aria-hidden
      />
      <div
        className="absolute inset-16 rounded-full border border-line/30 opacity-40"
        aria-hidden
      />

      {/* Central letter mark */}
      <div className="relative flex flex-col items-center gap-3 select-none">
        <span
          className={`font-display display text-[clamp(4rem,14vw,9rem)] leading-none ${accent.initial} opacity-90`}
          aria-hidden
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
        >
          <em>{letter}</em>
        </span>
        <span className="font-display text-[11px] font-medium tracking-[0.25em] text-ink-soft uppercase opacity-70">
          CHOP.
        </span>
      </div>

      {/* Corner texture marks */}
      <div className="absolute top-5 right-5 flex gap-1" aria-hidden>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-1 w-1 rounded-full ${accent.dot} opacity-40`} />
        ))}
      </div>
      <div className="absolute bottom-5 left-5 flex gap-1" aria-hidden>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-1 w-1 rounded-full ${accent.dot} opacity-30`} />
        ))}
      </div>
    </div>
  );
}

export function Gallery({ product }: { product: Product }) {
  const accent = getAccent(product.accent);

  return (
    <div className="flex flex-col gap-4">
      {/* Main visual */}
      <div className="w-full">
        <ProductIllustration product={product} />
      </div>

      {/* Thumbnail dots — single product view, dots represent variants */}
      <div className="flex items-center justify-center gap-2" aria-label="Product views">
        {product.variants.map((v, i) => (
          <div
            key={v.id}
            className={`rounded-full transition-all duration-200 ${
              i === 0
                ? `h-2.5 w-6 ${accent.dot}`
                : `h-2 w-2 ${accent.dot} opacity-30`
            }`}
            aria-label={v.label}
          />
        ))}
      </div>
    </div>
  );
}
