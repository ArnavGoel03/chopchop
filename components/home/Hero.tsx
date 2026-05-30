import Link from "next/link";
import type { Region } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { StarRating } from "@/components/ui/StarRating";
import { featuredProducts } from "@/lib/catalog";
import { Truck, CreditCard, ShieldCheck } from "lucide-react";

export function Hero({ region }: { region: Region }) {
  const products = featuredProducts();
  const hero = products[0]; // 5-blade chopper is the flagship

  return (
    <section className="relative overflow-hidden pb-16 pt-12 md:pb-24 md:pt-16">
      {/* Marigold radial background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[110%]"
        aria-hidden
      >
        <div className="absolute right-[-10%] top-[-20%] h-[640px] w-[640px] rounded-full bg-marigold/20 blur-[120px]" />
        <div className="absolute left-[-5%] top-[30%] h-[400px] w-[400px] rounded-full bg-tomato/10 blur-[100px]" />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left: copy */}
          <div>
            {/* Kicker */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-tomato" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato">
                Indian Kitchen Essentials
              </span>
            </div>

            {/* Headline */}
            <h1 className="display mt-4 text-[clamp(52px,9vw,108px)] font-semibold">
              Pull.{" "}
              <em className="font-display italic text-tomato">Chop.</em>
              <br />
              Done.
            </h1>

            <p className="mt-5 max-w-[44ch] text-lg text-ink-soft md:text-xl">
              {region.id === "in"
                ? "Pyaaz, tamatar, dhaniya — prepped in ten seconds. No electricity. No tears. COD across 25,000+ pincodes."
                : "Onions, tomatoes, herbs — chopped in ten seconds. No electricity needed. Shipped worldwide, tracked and insured."}
            </p>

            {/* Price row */}
            <div className="mt-7 flex flex-wrap items-baseline gap-4">
              <Price
                amount={hero.price[region.id]}
                compareAt={hero.compareAt?.[region.id]}
                region={region.id}
                size="lg"
              />
              <StarRating rating={hero.rating} count={hero.reviewCount} />
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink
                href={`/${region.segment}/product/${hero.slug}`}
                variant="primary"
                size="lg"
              >
                Order now
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm" aria-hidden>
                  →
                </span>
              </ButtonLink>
              <ButtonLink
                href={`/${region.segment}/shop`}
                variant="ghost"
                size="lg"
              >
                Browse all
              </ButtonLink>
            </div>

            {/* Trust row */}
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Truck size={15} className="text-mint" aria-hidden />
                {region.shippingCopy}
              </span>
              {region.codAvailable && (
                <span className="flex items-center gap-1.5">
                  <CreditCard size={15} className="text-marigold" aria-hidden />
                  COD available
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-tomato" aria-hidden />
                1-year warranty
              </span>
            </div>
          </div>

          {/* Right: Product visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Glow behind the visual */}
            <div
              className="pointer-events-none absolute inset-0 scale-[0.85] rounded-full bg-marigold/30 blur-[60px]"
              aria-hidden
            />

            {/* Product SVG visual — inline brand illustration */}
            <div className="relative flex aspect-square items-center justify-center rounded-[var(--radius-lg)] bg-tomato overflow-hidden shadow-[var(--shadow-pop)]">
              {/* grid overlay */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
                <defs>
                  <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                    <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-grid)" />
              </svg>

              {/* Radial glow */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_65%,rgba(242,169,59,0.55),transparent_65%)]"
                aria-hidden
              />

              {/* Chopper illustration */}
              <svg
                viewBox="0 0 380 380"
                className="relative z-10 h-[78%] w-[78%]"
                aria-label="CHOP. 5-blade chopper illustration"
                role="img"
              >
                {/* Bowl */}
                <ellipse cx="190" cy="280" rx="130" ry="38" fill="rgba(251,241,225,0.15)" />
                <path
                  d="M60 240 Q60 320 190 320 Q320 320 320 240 L320 220 Q320 200 190 200 Q60 200 60 220 Z"
                  fill="rgba(251,241,225,0.92)"
                />
                {/* Lid */}
                <ellipse cx="190" cy="200" rx="130" ry="22" fill="rgba(251,241,225,0.98)" />
                <ellipse cx="190" cy="198" rx="118" ry="18" fill="rgba(242,169,59,0.25)" />

                {/* Cord mechanism top */}
                <rect x="160" y="120" width="60" height="80" rx="12" fill="rgba(251,241,225,0.95)" />
                <ellipse cx="190" cy="120" rx="30" ry="10" fill="rgba(242,169,59,0.9)" />

                {/* Pull cord */}
                <line x1="190" y1="88" x2="190" y2="120" stroke="rgba(251,241,225,0.7)" strokeWidth="3" strokeDasharray="4 3" />
                {/* Handle knob */}
                <circle cx="190" cy="78" r="14" fill="rgba(251,241,225,0.95)" />
                <circle cx="190" cy="78" r="8" fill="rgba(194,74,45,0.5)" />

                {/* Blade cross lines inside bowl */}
                <line x1="100" y1="255" x2="280" y2="255" stroke="rgba(194,74,45,0.5)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="190" y1="210" x2="190" y2="295" stroke="rgba(194,74,45,0.5)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="118" y1="222" x2="262" y2="288" stroke="rgba(194,74,45,0.35)" strokeWidth="2" strokeLinecap="round" />
                <line x1="262" y1="222" x2="118" y2="288" stroke="rgba(194,74,45,0.35)" strokeWidth="2" strokeLinecap="round" />

                {/* Speed lines */}
                <line x1="60" y1="190" x2="32" y2="190" stroke="rgba(251,241,225,0.4)" strokeWidth="2" strokeLinecap="round" />
                <line x1="60" y1="200" x2="20" y2="200" stroke="rgba(251,241,225,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="320" y1="190" x2="348" y2="190" stroke="rgba(251,241,225,0.4)" strokeWidth="2" strokeLinecap="round" />
                <line x1="320" y1="200" x2="360" y2="200" stroke="rgba(251,241,225,0.25)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              {/* Spinning stamp badge */}
              <div
                className="pointer-events-none absolute right-4 top-4 h-[110px] w-[110px] [animation:spin_22s_linear_infinite]"
                style={{ animationName: "spin" }}
                aria-hidden
              >
                <svg viewBox="0 0 110 110" className="h-full w-full">
                  <defs>
                    <path
                      id="circle-text"
                      d="M 55,55 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                  </defs>
                  <text
                    fill="rgba(251,241,225,0.85)"
                    fontSize="9.5"
                    fontFamily="var(--font-jakarta), sans-serif"
                    fontWeight="700"
                    letterSpacing="3.2"
                  >
                    <textPath href="#circle-text">
                      CHOP. · 5 BLADES · NO ELECTRICITY · FREE SHIP ·{" "}
                    </textPath>
                  </text>
                  <circle cx="55" cy="55" r="12" fill="rgba(242,169,59,0.9)" />
                  <text
                    x="55"
                    y="59"
                    textAnchor="middle"
                    fill="var(--color-ink)"
                    fontSize="10"
                    fontFamily="var(--font-fraunces), serif"
                    fontWeight="700"
                    fontStyle="italic"
                  >
                    C
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
