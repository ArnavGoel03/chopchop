import Link from "next/link";
import type { Region } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/shop/ProductCard";
import { StarRating } from "@/components/ui/StarRating";
import { featuredProducts, CATEGORIES, getProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import {
  Truck,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// ─── Featured Products ───────────────────────────────────────────────────────

export function FeaturedSection({ region }: { region: Region }) {
  const products = featuredProducts();
  return (
    <section className="py-20" aria-labelledby="featured-heading">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato-d">
              Our picks
            </span>
            <h2
              id="featured-heading"
              className="display mt-2 text-4xl font-semibold md:text-5xl"
            >
              Things worth{" "}
              <em className="font-display italic text-tomato">buying</em>
            </h2>
          </div>
          <ButtonLink
            href={`/${region.segment}/shop`}
            variant="ghost"
            size="sm"
          >
            All products <ArrowRight size={14} aria-hidden />
          </ButtonLink>
        </div>

        <ul
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} region={region.id} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ─── Shop by Category ────────────────────────────────────────────────────────

const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; hover: string }> = {
  choppers:  { bg: "bg-tomato",   text: "text-white",   hover: "hover:bg-tomato-d" },
  prep:      { bg: "bg-marigold", text: "text-ink",     hover: "hover:brightness-105" },
  cookware:  { bg: "bg-ink",      text: "text-paper",   hover: "hover:opacity-90" },
  storage:   { bg: "bg-melon",    text: "text-white",   hover: "hover:opacity-90" },
  bundles:   { bg: "bg-mint",     text: "text-white",   hover: "hover:opacity-90" },
};

export function CategorySection({ region }: { region: Region }) {
  return (
    <section
      className="border-t border-line py-20"
      aria-labelledby="categories-heading"
    >
      <Container>
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato">
            Shop by category
          </span>
          <h2
            id="categories-heading"
            className="display mt-2 text-4xl font-semibold md:text-5xl"
          >
            Every corner of the{" "}
            <em className="font-display italic text-marigold-d">kitchen</em>
          </h2>
        </div>

        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          role="list"
        >
          {CATEGORIES.map((cat) => {
            const styles = CATEGORY_ACCENTS[cat.id] ?? CATEGORY_ACCENTS.choppers;
            return (
              <li key={cat.id}>
                <Link
                  href={`/${region.segment}/shop/${cat.id}`}
                  className={`group flex flex-col items-start gap-3 rounded-[var(--radius-card)] p-6 transition-transform duration-200 hover:-translate-y-1 ${styles.bg} ${styles.text} ${styles.hover} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato`}
                >
                  <span className="font-display text-2xl font-semibold leading-tight">
                    {cat.label}
                  </span>
                  <span className="text-sm opacity-80 leading-snug">
                    {cat.blurb}
                  </span>
                  <ArrowRight
                    size={18}
                    className="mt-auto opacity-70 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Add your veggies",
    body: "Quarter the onion, drop in. The 900ml bowl holds enough for a full kadhai's worth of prep.",
    icon: (
      <svg viewBox="0 0 160 120" aria-hidden className="h-28 w-full">
        {/* Bowl with veg */}
        <ellipse cx="80" cy="90" rx="58" ry="16" fill="rgba(194,74,45,0.12)" />
        <path d="M22 68 Q22 94 80 94 Q138 94 138 68 L138 56 Q138 44 80 44 Q22 44 22 56Z" fill="rgba(251,241,225,0.9)" stroke="rgba(31,20,16,0.14)" strokeWidth="1" />
        <ellipse cx="80" cy="56" rx="58" ry="12" fill="rgba(251,241,225,0.95)" />
        {/* Onion layers */}
        <ellipse cx="68" cy="60" rx="16" ry="12" fill="rgba(242,169,59,0.5)" />
        <ellipse cx="95" cy="62" rx="14" ry="10" fill="rgba(242,169,59,0.4)" />
        <ellipse cx="74" cy="58" rx="8" ry="6" fill="rgba(242,169,59,0.7)" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Pull the cord",
    body: "One firm pull spins all five blades at 1,000rpm. Three pulls gives you restaurant-grade uniform pieces.",
    icon: (
      <svg viewBox="0 0 160 120" aria-hidden className="h-28 w-full">
        {/* Chopper body */}
        <rect x="52" y="38" width="56" height="58" rx="12" fill="rgba(251,241,225,0.9)" stroke="rgba(31,20,16,0.14)" strokeWidth="1" />
        <ellipse cx="80" cy="38" rx="28" ry="9" fill="rgba(242,169,59,0.85)" />
        {/* Cord */}
        <line x1="80" y1="16" x2="80" y2="38" stroke="rgba(31,20,16,0.5)" strokeWidth="2.5" strokeDasharray="4 3" />
        <circle cx="80" cy="12" r="8" fill="rgba(194,74,45,0.9)" />
        {/* Pull arrows */}
        <path d="M98 10 L106 14 L102 18" fill="none" stroke="rgba(242,169,59,0.8)" strokeWidth="2" strokeLinecap="round" />
        <path d="M62 10 L54 14 L58 18" fill="none" stroke="rgba(242,169,59,0.8)" strokeWidth="2" strokeLinecap="round" />
        {/* Motion lines */}
        <line x1="34" y1="68" x2="20" y2="68" stroke="rgba(194,74,45,0.4)" strokeWidth="2" strokeLinecap="round" />
        <line x1="126" y1="68" x2="140" y2="68" stroke="rgba(194,74,45,0.4)" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="76" x2="14" y2="76" stroke="rgba(194,74,45,0.25)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="126" y1="76" x2="146" y2="76" stroke="rgba(194,74,45,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Straight to the pan",
    body: "The bowl is your prep dish. Pop the lid, tip into the kadhai. Rinse the whole thing in thirty seconds.",
    icon: (
      <svg viewBox="0 0 160 120" aria-hidden className="h-28 w-full">
        {/* Chopped veg pieces */}
        <rect x="48" y="42" width="18" height="14" rx="3" fill="rgba(107,163,120,0.7)" />
        <rect x="72" y="38" width="16" height="16" rx="3" fill="rgba(242,169,59,0.7)" />
        <rect x="95" y="44" width="18" height="12" rx="3" fill="rgba(107,163,120,0.5)" />
        <rect x="58" y="62" width="14" height="14" rx="3" fill="rgba(242,169,59,0.5)" />
        <rect x="84" y="60" width="16" height="16" rx="3" fill="rgba(107,163,120,0.65)" />
        {/* Arrow down to pan */}
        <line x1="80" y1="82" x2="80" y2="96" stroke="rgba(31,20,16,0.3)" strokeWidth="2" strokeLinecap="round" />
        <path d="M74 92 L80 98 L86 92" fill="none" stroke="rgba(31,20,16,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Pan outline */}
        <path d="M36 106 Q36 114 80 114 Q124 114 124 106 L124 100 Q124 96 80 96 Q36 96 36 100Z" fill="rgba(31,20,16,0.08)" stroke="rgba(31,20,16,0.2)" strokeWidth="1" />
      </svg>
    ),
  },
];

export function HowItWorks({ region }: { region: Region }) {
  return (
    <section
      className="py-20"
      aria-labelledby="how-heading"
    >
      <Container>
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato">
            How it works
          </span>
          <h2
            id="how-heading"
            className="display mt-2 text-4xl font-semibold md:text-5xl"
          >
            Three pulls, done.{" "}
            <em className="font-display italic text-tomato">Every time.</em>
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3" role="list">
          {STEPS.map((step) => (
            <li
              key={step.num}
              className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-2 p-8"
            >
              <span
                className="pointer-events-none absolute right-5 top-4 font-display text-[52px] italic text-marigold opacity-60 leading-none"
                aria-hidden
              >
                {step.num}
              </span>
              <div className="mb-4">{step.icon}</div>
              <h3 className="font-display text-2xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// ─── Trust Badges ────────────────────────────────────────────────────────────

export function TrustBadges({ region }: { region: Region }) {
  const badges = [
    {
      icon: <Truck size={24} aria-hidden />,
      label: region.id === "in" ? "Free delivery" : "Worldwide shipping",
      sub: region.id === "in" ? "3–7 working days" : "7–14 business days",
    },
    {
      icon: <ShieldCheck size={24} aria-hidden />,
      label: "1-year warranty",
      sub: "Free replacement, no questions",
    },
    ...(region.codAvailable
      ? [
          {
            icon: <CreditCard size={24} aria-hidden />,
            label: "Cash on delivery",
            sub: "25,000+ pincodes",
          },
        ]
      : []),
    {
      icon: <RotateCcw size={24} aria-hidden />,
      label: "Easy returns",
      sub: "7-day hassle-free policy",
    },
  ];

  return (
    <section
      className="border-y border-ink bg-ink py-10"
      aria-label="Trust and delivery information"
    >
      <Container>
        <ul
          className="grid grid-cols-2 gap-6 sm:grid-cols-4"
          role="list"
        >
          {badges.map((b) => (
            <li
              key={b.label}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span className="text-marigold">{b.icon}</span>
              <span className="font-display text-lg font-medium text-paper">
                {b.label}
              </span>
              <span className="text-xs text-paper/60">{b.sub}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ─── Reviews Strip ───────────────────────────────────────────────────────────

const REVIEWS = [
  {
    author: "Ananya R.",
    location: "Mumbai",
    rating: 5,
    body: "Bought one for my mother in Pune. She used to cry every time she made biryani. Now her prep takes five minutes — I ordered a second for myself.",
  },
  {
    author: "Karthik S.",
    location: "Bengaluru",
    rating: 5,
    body: "As a bachelor who can barely cook, this saved me. Salad for lunch is actually possible on a Tuesday.",
  },
  {
    author: "Meera D.",
    location: "Delhi NCR",
    rating: 4,
    body: "Solid build, sharp blades, easy to clean. I wish the bowl was a touch bigger — but for the price with COD, no complaints.",
  },
];

export function ReviewsStrip({ region }: { region: Region }) {
  return (
    <section
      className="py-20"
      aria-labelledby="reviews-heading"
    >
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-tomato-d">
              What people say
            </span>
            <h2
              id="reviews-heading"
              className="display mt-2 text-4xl font-semibold md:text-5xl"
            >
              2,417 kitchens{" "}
              <em className="font-display italic text-marigold-d">changed.</em>
            </h2>
          </div>
          <StarRating rating={4.8} count={2417} />
        </div>

        <ul
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
          role="list"
        >
          {REVIEWS.map((r) => (
            <li
              key={r.author}
              className="rounded-[var(--radius-card)] border border-line bg-paper-2 p-7"
            >
              <div
                className="text-marigold-d tracking-[3px]"
                aria-label={`${r.rating} stars`}
              >
                {"★".repeat(r.rating)}
              </div>
              <blockquote className="mt-4 font-display text-[19px] font-medium leading-[1.35] text-ink">
                &ldquo;{r.body}&rdquo;
              </blockquote>
              <footer className="mt-5 flex justify-between text-xs text-ink-soft">
                <cite className="not-italic font-semibold text-ink">{r.author}</cite>
                <span>{r.location}</span>
              </footer>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCTA({ region }: { region: Region }) {
  const flagship = getProduct("5-blade-chopper");
  const flagshipPrice = flagship
    ? formatMoney(flagship.price[region.id], region.id)
    : region.id === "in"
    ? "₹999"
    : "$14.99";
  const codFeeFormatted =
    region.id === "in" && region.codFee > 0
      ? formatMoney(region.codFee, region.id)
      : null;

  return (
    <section
      className="relative overflow-hidden py-28 text-center"
      aria-labelledby="final-cta-heading"
    >
      {/* Marigold radial */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(242,169,59,0.45),transparent_60%)]"
        aria-hidden
      />

      <Container className="relative z-10">
        <h2
          id="final-cta-heading"
          className="display mx-auto text-[clamp(56px,9vw,140px)] font-semibold leading-[0.9] tracking-tight"
        >
          Prep{" "}
          <em className="font-display italic text-tomato">faster.</em>
          <br />
          Cook better.
        </h2>
        <p className="mx-auto mt-7 max-w-[48ch] text-lg text-ink-soft">
          {region.id === "in"
            ? `${flagshipPrice}. Free delivery.${codFeeFormatted ? ` +${codFeeFormatted} COD fee.` : " COD available at checkout."} Warranty included.`
            : "Ships worldwide. Tracked and insured. 1-year warranty on every order."}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink
            href={`/${region.segment}/product/5-blade-chopper`}
            variant="primary"
            size="lg"
          >
            Order the CHOP. Chopper
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm"
              aria-hidden
            >
              →
            </span>
          </ButtonLink>
          <ButtonLink
            href={`/${region.segment}/shop`}
            variant="ghost"
            size="lg"
          >
            Browse everything
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
