import { cn } from "@/lib/utils";

const ACCENT_STYLES: Record<string, { bg: string; glow: string; text: string }> = {
  tomato:  { bg: "bg-tomato",   glow: "from-tomato/40",   text: "text-white" },
  marigold:{ bg: "bg-marigold", glow: "from-marigold/40", text: "text-ink" },
  mint:    { bg: "bg-mint",     glow: "from-mint/40",     text: "text-white" },
  melon:   { bg: "bg-melon",    glow: "from-melon/40",    text: "text-white" },
  ink:     { bg: "bg-ink",      glow: "from-ink/30",      text: "text-paper" },
};

export function ProductVisual({
  accent,
  initial,
  className,
  size = "full",
}: {
  accent: string;
  initial: string;
  className?: string;
  size?: "full" | "card";
}) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.tomato;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        size === "card" ? "aspect-[4/3] rounded-[14px]" : "aspect-square rounded-[18px]",
        styles.bg,
        className,
      )}
      aria-hidden
    >
      {/* Radial glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-radial-[ellipse_at_50%_60%]",
          styles.glow,
          "to-transparent opacity-60",
        )}
      />
      {/* Grid lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`grid-${accent}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${accent})`} />
      </svg>
      {/* Initial letter */}
      <span
        className={cn(
          "font-display relative z-10 select-none font-semibold leading-none tracking-tight",
          size === "card" ? "text-[clamp(48px,8vw,80px)]" : "text-[clamp(80px,14vw,160px)]",
          styles.text,
          "opacity-90",
        )}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70', fontStyle: "italic" }}
      >
        {initial}
      </span>
    </div>
  );
}
