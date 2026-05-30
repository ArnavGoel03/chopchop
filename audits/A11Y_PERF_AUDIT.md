# CHOP. — Accessibility, Performance & Next.js Quality Audit

**Branch:** `feat/ecommerce-rebuild`  
**Audited:** 2026-05-30  
**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 (CSS-first) · Zustand · Razorpay / Stripe

---

## Executive Summary

| Dimension | Score | One-line verdict |
|---|---|---|
| **Accessibility (WCAG 2.1 AA)** | **6.5 / 10** | Solid semantic structure and ARIA on interactive widgets; let down by five colour-contrast failures, a missing `<skip-to-content>` link, duplicate-announcement issues on the BuyBox, and an unlabelled GST section |
| **Performance / Core Web Vitals** | **7.5 / 10** | Good static generation and font preloading; `"use client"` surface is minimised; three concrete risks — Razorpay/Stripe scripts loaded eagerly, the 240×240 body noise SVG repainted on every paint layer, and the checkout page being a fully-client route with no SSR skeleton |
| **Next.js Correctness** | **9 / 10** | Excellent — async `params` correctly `await`-ed everywhere, `generateStaticParams` on every leaf route, `Suspense` on `useSearchParams`, correct `cache: 'no-store'` on order API, no client hooks inside server components. One minor issue: checkout page `"use client"` at the top means no SSR shell for the checkout form |

**Overall health:** The codebase is well-structured and clearly authored with accessibility in mind (good landmark use, aria-labels, aria-live, focus-visible styles in the Button primitive). The failures are largely colour and labelling issues that are straightforward to fix, plus two performance concerns that could meaningfully affect LCP/FCP on mobile.

---

## Findings Table

| ID | Sev | Dim | Title | Location | Description | Fix |
|---|---|---|---|---|---|---|
| **A01** | **Critical** | A11y · Contrast | `marigold` text on `paper`/`paper-2` backgrounds fails at all text sizes | `components/home/sections.tsx:349`, `components/ui/Price.tsx:26-30`, `app/[region]/track/TrackClient.tsx:299` | `#F2A93B` on `#FBF1E1` → **1.79:1** (need 4.5 for normal, 3.0 for large). Affects: star ratings, %-OFF badge text (Price), "marigold" StatusBadge text, `TrustBadges` sub-labels. Also affects marigold kicker text in `sections.tsx` where `text-marigold opacity-60` appears. | Use `text-ink` instead of `text-marigold` for text. For the price badge (`bg-marigold` with `text-ink`) the contrast is 9.02 — **pass**; the problem is the opposite use: `text-marigold` on light backgrounds. Replace with `text-tomato-d` or `text-ink-soft` for label text. |
| **A02** | **Critical** | A11y · Contrast | `mint` text on `paper`/`paper-2` backgrounds fails at all sizes | `components/cart/CouponField.tsx:39`, `components/ui/Badge.tsx:13` (`tone="mint"`), `app/[region]/checkout/page.tsx:547`, `TrackClient.tsx:298` | `#6BA378` on `#FBF1E1` → **2.63:1**. Specifically: "✓ applied" coupon text, WhatsApp link in checkout, `mint` Badge ("Verified"), StatusBadge "mint" tone. | Replace `text-mint` on light surfaces with `text-mint-d` (create `--color-mint-d: #3d7a4a` ≈ 5.5:1 on paper) or use the badge pattern where ink sits on a tinted mint background. |
| **A03** | **Critical** | A11y · Contrast | `ink-soft` on `ink` background (footer bottom bar) fails | `components/site/Footer.tsx:41-42` | `#4A3A33` on `#1F1410` → **1.67:1**. The footer legal line "© 2026 CHOP Goods Pvt. Ltd." and "Made with sabzi in Bengaluru." use `text-paper/70` (passes at 8.27:1) at the outer div but the two `<div>` items at line 41-42 are `text-paper/70` so they pass — **but** any `ink-soft` text added inside the `bg-ink` sections fails. Specifically `footer` outer rule uses `text-paper/70`; verify no child overrides to `text-ink-soft`. | Audit confirmed `footer` root sets `text-paper/70` which computes ~8.3:1. Passing as written. Flag for future: do not use `text-ink-soft` inside any `bg-ink` container. |
| **A04** | **High** | A11y · Contrast | `tomato` on `paper`/`paper-2` text fails at normal size (≤18px / not bold) | `components/home/Hero.tsx:34`, `components/home/sections.tsx:26,82`, multiple kicker spans across all pages | `#C24A2D` on `#FBF1E1` → **4.35:1** (needs 4.5). All `text-tomato text-xs` kicker labels ("Our picks", "Shop by category", "How it works", "Indian Kitchen Essentials", etc.) are at 12px, not bold — AA normal fail by a narrow margin. At font-bold the large-text threshold (18px bold = 14pt bold) is not met at 12px. | Darken tomato for text-only contexts: `--color-tomato-text: #ad3f25` (~4.8:1 on paper) and use it for small kicker spans. Alternatively use `font-bold` + `text-[14px]` to push into bold-large territory (3:1 threshold). |
| **A05** | **High** | A11y · Contrast | White on WhatsApp green `#25D366` → **1.98:1** — critical fail | `app/[region]/order/[code]/page.tsx:248`, `app/[region]/checkout/page.tsx:547` | The "Confirm on WhatsApp" / "Order on WhatsApp" button uses `bg-[#25D366] text-white`. 1.98:1 is below even the 3:1 large-text minimum. | Change text to `#1a3d1f` (dark green, ~8:1 on #25D366) or use `text-ink`. Never use white on the standard WhatsApp green. |
| **A06** | **High** | A11y · Contrast | `mint` text inside `bg-mint/15` badge → **2.31:1** — fail | `components/ui/Badge.tsx:13` (`tone="mint"`) | The Verified badge composites mint at 15% alpha over paper (≈ `#D4E8D9`). `#6BA378` on `#D4E8D9` → 2.31:1. | Use a darker mint for text (`text-[#2e6640]`) inside tinted mint backgrounds, or switch to `text-ink` on `bg-mint/20`. |
| **A07** | **High** | A11y | No skip-to-content link | `app/[region]/layout.tsx` | There is no "Skip to main content" focus-bypass link. Keyboard-only users Tab through the announcement bar, full header nav, region switcher, and cart icon before reaching page content. | Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` as the first child of `<body>`, and add `id="main-content"` to `<main>`. |
| **A08** | **High** | A11y | FAQ accordion missing `aria-controls` association | `components/content/Faq.tsx:43-47` | The `<button>` has `aria-expanded` but no `aria-controls` linking to the answer panel. Screen readers may not announce which panel is controlled. The answer panel also has `role="region"` without a matching `aria-labelledby`. | Add `id={`faq-btn-${item.id}`}` to button, `id={`faq-panel-${item.id}`}` to panel div, and `aria-controls={`faq-panel-${item.id}`}` on button, `aria-labelledby={`faq-btn-${item.id}`}` on panel. |
| **A09** | **High** | A11y | `<header>` inside `<div>` inside page body in Shop and Category pages — heading hierarchy gap | `app/[region]/shop/page.tsx:47`, `app/[region]/shop/[category]/page.tsx:51` | The shop header uses `<header>` (correct landmark) but the element wraps an `h1`. The parent `<div className="py-12">` has no landmark role. Not a hard fail, but the page-level `<header>` used inside `<main>` is semantically confusing — `<header>` within `<main>` becomes a generic container, not a banner landmark. | Change the shop/category inner `<header>` to `<div role="banner">` or simply a plain `<div>` — `<header>` as a direct descendant of `<main>` is valid but unusual; a plain `<div>` with the `h1` directly is clearer. |
| **A10** | **High** | A11y | ProductCard image link is `aria-hidden tabIndex={-1}` with no accessible equivalent | `components/shop/ProductCard.tsx:22-27` | The visual thumbnail link is `aria-hidden` and `tabIndex={-1}`, which is fine as long as the name link below provides the accessible path. That pattern is correct **but** if JavaScript is disabled, the only visible product link in the card is the thumbnail (there's no reliable fallback). The main `h3 > Link` has `href` so this is fine JS-on — but the thumbnail link `aria-hidden` means blind users see only text links — acceptable. Flag: ensure the `h3` link is always present before the hidden image link in reading order. | The pattern is acceptable. Move the image div visually after the `h3` in DOM order would improve reading order. Currently image is first in DOM but after product name in reading order due to `tabIndex={-1}`. No change required but worth noting. |
| **A11** | **Medium** | A11y | `add-to-cart` confirmation announced twice | `components/product/BuyBox.tsx:157-179` | When `addedToCart` is true, both the `<Button aria-label="Added to cart">` AND the floating `<div role="status" aria-live="polite">` announce the confirmation simultaneously. Screen readers will say "Added to cart" twice in quick succession. | Remove `role="status"` from the floating bubble (or remove `aria-live="polite"` from it). Keep the single `aria-label` change on the button to convey state; the visual bubble is already a sufficient sighted affordance. |
| **A12** | **Medium** | A11y | GST toggle button in checkout has no `aria-expanded` / `aria-controls` | `app/[region]/checkout/page.tsx:473-482` | The "I need a GST invoice" `<button>` toggles a panel but has no `aria-expanded` attribute. Screen readers cannot tell users whether the section is open or closed. | Add `aria-expanded={gstToggle}` and `aria-controls="gst-panel"` on the button; add `id="gst-panel"` on the toggled `<div>`. |
| **A13** | **Medium** | A11y | `Field` label not linked to error paragraph via `aria-describedby` (partial) | `app/[region]/checkout/page.tsx:403-404` | The `name` field has `aria-describedby={errors.name ? "field-name-error" : undefined}` but the error `<p>` has `role="alert"` and no matching `id="field-name-error"`. The `aria-describedby` target doesn't exist. Other fields (phone, address, gstin) have no `aria-describedby` at all. | Assign `id={`field-${fieldKey}-error`}` to the error `<p>` in the `Field` component, and wire `aria-describedby` properly. The Field component should accept an `errorId` prop. |
| **A14** | **Medium** | A11y | `StarRating` empty-star characters are invisible in forced-color / high-contrast mode | `components/ui/StarRating.tsx:17` | `{"★".repeat(5 - full)}` wrapped in `text-line` (rgba 0.14 opacity). In Windows High Contrast mode, CSS colour overrides don't apply; the empty stars might be invisible. The aria-hidden wrapper means blind users don't see them, but sighted high-contrast users lose the rating gauge. | Replace text-star characters with an SVG-based rating where filled/empty is communicable without colour (e.g. stroke outline for empty stars), or add `@media (forced-colors: active)` overrides. |
| **A15** | **Medium** | A11y | Mobile navigation links hidden with `hidden md:flex` — no mobile nav provided | `components/site/Header.tsx:30` | The 4 nav links are hidden on mobile with `hidden md:flex` and there is no hamburger/drawer menu. On mobile, navigation to Shop / Choppers / Prep / Cookware categories is impossible from the header. Only deep links and breadcrumbs work. | Add a mobile navigation drawer or bottom bar. This is a UX/A11y gap for keyboard and mobile users. |
| **A16** | **Low** | A11y | `<ol>` with `role="list"` in HowItWorks — redundant but harmless | `components/home/sections.tsx:208` | `<ol ... role="list">` — adding `role="list"` to an `ol` removes the semantics of it being an ordered list and makes it a generic list. Steps 1/2/3 benefit from their ordered nature. | Remove `role="list"` from the `<ol>`. Keep the `aria-label` or `aria-labelledby` if desired. (Note: VoiceOver on Safari historically stripped list semantics from lists with `list-style: none` — but `ol` with explicit numbers is fine without the override.) |
| **A17** | **Low** | A11y | `required` asterisk only marked `aria-hidden` on `Field` but input `aria-required` is set correctly | `app/[region]/checkout/page.tsx:73` | The asterisk `*` has `aria-hidden` and `aria-required="true"` is on the input. This is correct. Verify screen readers announce "required" from the input, not the label. Pattern is fine as-is. | No change needed. |
| **P01** | **High** | Perf | Razorpay and Stripe scripts loaded on *mount* of checkout — blocking CWV | `app/[region]/checkout/page.tsx:163-170` | `loadRazorpay()` and `loadStripe()` dynamically inject `<script>` tags inside a `useEffect` on mount. This injects a third-party script that can block main-thread and delay TBT/TTI. Razorpay's `checkout.js` is ~200KB. | Defer loading until the user clicks "Pay securely": call `loadRazorpay()`/`loadStripe()` inside `handlePlaceOrder`, not in a `useEffect`. Alternatively use `<link rel="preconnect">` to `checkout.razorpay.com` / `js.stripe.com` in the layout and load lazily. |
| **P02** | **Medium** | Perf | `body::after` grain SVG repainted on every scroll (fixed, z-index 200) | `app/globals.css:50-59` | The `position: fixed; z-index: 200; mix-blend-mode: multiply` element forces a compositing layer on every page and the blend mode triggers re-compositing whenever any paint below it changes. On low-end devices this degrades scroll performance. The SVG is inlined as a `background-image` `data:` URI (small) but the compositing cost is real. | Move the grain to a CSS `@property` + `backdrop-filter` approach, or promote it to its own GPU layer via `will-change: transform` to avoid re-painting on scroll. Alternatively remove `mix-blend-mode` and bake the tinted grain directly into the SVG fill so no blending is needed at runtime. |
| **P03** | **Medium** | Perf | Checkout page is entirely `"use client"` — no SSR shell | `app/[region]/checkout/page.tsx:1` | The checkout page is a full client component. Initial HTML is an empty shell; the entire form renders on the client after hydration. This makes LCP dependent on JS execution time, especially on mid-range Android devices. | Extract the static structure (headings, field scaffolding) into a server component shell; push only the stateful form logic to a `CheckoutForm` client component. This follows the App Router "server outer, client leaf" pattern. |
| **P04** | **Medium** | Perf | Cart page is `"use client"` at the top level | `app/[region]/cart/page.tsx:1` | Same pattern as checkout: the entire cart page is a client component. Empty/non-empty branch can be rendered on the server in most cases. | Split into server wrapper that passes a `lines` prop to a `CartClient` component, or keep client but add a `<Suspense>` boundary with a static skeleton so SSR provides the shell. |
| **P05** | **Low** | Perf | `CartCount` hydration pattern causes CLS | `components/site/CartCount.tsx:9-11` | `CartCount` renders `null` until mounted to avoid SSR mismatch. When it appears with a count, it shifts the cart icon layout (adds 5px badge). The badge changes the computed size of the header icon. | Reserve space for the badge with `min-h-5 min-w-5` even when empty (use `invisible` instead of `null`) to prevent layout shift. |
| **P06** | **Low** | Perf | `next/image` never used — all "images" are inline SVGs/placeholders | Throughout | There are no real product images yet (placeholder illustrations). When real photography arrives, using `<img>` without `next/image` will bypass lazy-loading, format optimization (AVIF/WebP), and priority hints. | This is a pre-launch note: adopt `next/image` for all real product photography from day one. Set `priority` on the hero/gallery image. |
| **N01** | **Low** | Next.js | `terms` links in checkout footer use bare `/terms` and `/privacy` without region prefix | `app/[region]/checkout/page.tsx:628-631` | `<a href="/terms">` and `<a href="/privacy">` are bare paths that will hit the root `/` middleware and redirect to `/in` or `/intl` based on geo. This works but causes an extra redirect and is inconsistent with the rest of the codebase which always uses region-prefixed paths. | Replace with `<Link href={`/${seg}/terms`}>` and `<Link href={`/${seg}/privacy`}>` using Next.js `Link`. |
| **N02** | **Low** | Next.js | `JsonLd.tsx` product URL uses `/products/` not `/product/` | `components/seo/JsonLd.tsx:88` | `absoluteUrl(\`/${region.id}/products/${product.slug}\`)` — note `products` (plural). The actual route is `/product/[slug]` (singular). This causes the JSON-LD `url` and `offers.url` to point to 404 pages. | Change `products` → `product` in `productJsonLd()`. |
| **N03** | **Low** | Next.js | `order/[code]/page.tsx` fetches its own API route with an absolute localhost URL | `app/[region]/order/[code]/page.tsx:45-48` | The server-side `fetchOrder` constructs a URL using `process.env.NEXT_PUBLIC_SITE_URL ?? \`http://localhost:${PORT}\``. On Vercel Preview deployments `NEXT_PUBLIC_SITE_URL` may not be set, causing a fetch to localhost that times out. | Directly import and call the database/orders service function (`lib/orders.ts`) instead of going through HTTP. Avoids network round-trip and fragile URL construction. |
| **N04** | **Info** | Next.js | `searchParams` in checkout is unwrapped via `use(searchParams)` inside a `"use client"` — correct | `app/[region]/checkout/page.tsx:129` | The checkout page correctly receives `searchParams` as a `Promise<...>` and unwraps with `use()`. This is the correct App Router pattern for client pages that receive searchParams. | No change needed. Noted as correct usage. |

---

## Contrast Ratio Reference

| Pair | Hex fg / bg | Ratio | AA Normal (4.5:1) | AA Large (3.0:1) |
|---|---|---|---|---|
| ink on paper | `#1F1410` / `#FBF1E1` | **16.10** | ✅ PASS | ✅ PASS |
| ink on paper-2 | `#1F1410` / `#F5E5C8` | **14.52** | ✅ PASS | ✅ PASS |
| ink-soft on paper | `#4A3A33` / `#FBF1E1` | **9.66** | ✅ PASS | ✅ PASS |
| ink-soft on paper-2 | `#4A3A33` / `#F5E5C8` | **8.71** | ✅ PASS | ✅ PASS |
| white on tomato (buttons) | `#FFFFFF` / `#C24A2D` | **4.87** | ✅ PASS | ✅ PASS |
| ink on marigold (badge) | `#1F1410` / `#F2A93B` | **9.02** | ✅ PASS | ✅ PASS |
| paper/70 on ink (footer) | `≈#B9AEA2` / `#1F1410` | **8.27** | ✅ PASS | ✅ PASS |
| paper/60 on ink (trust sub) | `≈#A89E94` / `#1F1410` | **6.38** | ✅ PASS | ✅ PASS |
| **tomato on paper (kicker text)** | `#C24A2D` / `#FBF1E1` | **4.35** | ❌ FAIL | ✅ PASS |
| **marigold on paper (text)** | `#F2A93B` / `#FBF1E1` | **1.79** | ❌ FAIL | ❌ FAIL |
| **mint on paper (text)** | `#6BA378` / `#FBF1E1` | **2.63** | ❌ FAIL | ❌ FAIL |
| **mint on mint/15 badge bg** | `#6BA378` / `≈#D4E8D9` | **2.31** | ❌ FAIL | ❌ FAIL |
| **tomato on tomato/12 badge bg** | `#C24A2D` / `≈#F2DDDA` | **3.37** | ❌ FAIL | ✅ PASS |
| **white on WhatsApp #25D366** | `#FFFFFF` / `#25D366` | **1.98** | ❌ FAIL | ❌ FAIL |
| ink-soft on ink (footer legal) | `#4A3A33` / `#1F1410` | **1.67** | ❌ FAIL | ❌ FAIL |

> Note: `ink-soft on ink` appears in the Footer bottom row classes but the outer `footer` element sets `text-paper/70` which resolves to 8.27:1. If any child ever resets to `text-ink-soft` inside `bg-ink`, it would fail immediately. Flag and guard.

---

## Done Well

1. **Async params pattern** — every server component and `generateMetadata` function correctly receives `params: Promise<...>` and `await`s it. This is clean compliance with Next.js 16 App Router expectations.

2. **`generateStaticParams` coverage** — present on every dynamic route that can be prerendered: `[region]`, `[region]/product/[slug]`, `[region]/shop/[category]`, legal pages. No ISR gaps.

3. **`Suspense` wrapping `useSearchParams`** — `app/[region]/track/page.tsx` correctly wraps `TrackClient` (which calls `useSearchParams`) in `<Suspense>`. This is a common miss in App Router.

4. **`aria-live` regions** — `TrackClient.tsx` uses `aria-live="polite" aria-atomic="true"` on the results region; `BuyBox` `qty` span uses `aria-live="polite"`; the quantity stepper uses `aria-live="polite" aria-atomic="true"`. Good async announcement coverage.

5. **Lucide tree-shaking** — all lucide icons are imported individually (`import { Truck } from "lucide-react"`) not via `import * as Icons`. Lucide supports individual named imports cleanly; no full-library bundle concern.

6. **`PaymentMethodTabs` uses real `<fieldset>/<legend>/<input type="radio">`** — not a custom ARIA widget. Screen readers handle this natively and correctly.

7. **Focus-visible styles** — `Button.tsx` and `ButtonLink.tsx` include `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato` in the base class. Interactive elements in BuyBox, variant picker, and stepper buttons also carry `focus-visible:outline-tomato`. Good baseline keyboard visibility.

8. **`prefers-reduced-motion` in globals.css** — the block at line 61-71 correctly kills all `animation-duration` and `transition-duration`. The spinning stamp (`[animation:spin_22s_linear_infinite]`) is covered. The `motion-reduce:animate-none` class on skeletons in TrackClient and TrackPage provides a second layer.

9. **`next/font` for both fonts** — `Fraunces` and `Plus_Jakarta_Sans` loaded via `next/font/google` with `display: "swap"` and correct `variable` names. Font display swap is set. No FOUT beyond standard swap behaviour.

10. **Server/client split discipline** — the majority of pages are server components. Client components (`BuyBox`, `CartPage`, `CheckoutPage`, `RegionSwitcher`, `CartCount`, `CouponField`, `QtyStepper`, `StatusSelect`, `Faq`, `TrackClient`) all have clear interactive/stateful reasons for being client-side.

11. **`RegionProvider` is a light context** — wraps only a static `Region` object, no zustand or heavy state. Doesn't force client subtrees unnecessarily.

12. **Product page breadcrumb** uses `<nav aria-label="Breadcrumb">` with `<Link>` components and an `aria-hidden` separator. Proper landmark + keyboard path.

13. **SEO completeness** — `generateMetadata` on every page including `robots: { index: false }` on order confirmation pages. `JsonLd` structured data for Product, BreadcrumbList, Organization, and Website schemas.

---

## Prioritised Fix List

### Immediate (before ad launch)

1. **A01 + A02** — Contrast: `text-marigold` and `text-mint` on light backgrounds. Create `--color-mint-d` and `--color-tomato-text` tokens; replace all `text-marigold`/`text-mint` used as body/label text on light surfaces.
2. **A05** — WhatsApp button: change `text-white` to `text-ink` or dark green on `bg-[#25D366]`.
3. **A07** — Add skip-to-content link in root layout.
4. **P01** — Move Razorpay/Stripe `loadScript()` calls inside the submit handler, not in `useEffect` on mount.
5. **N02** — Fix `productJsonLd()` URL: `/products/` → `/product/`.

### High priority (first sprint post-launch)

6. **A04** — Tomato kicker text at 12px: darken `--color-tomato` for text-only contexts or bump to ≥14px bold.
7. **A08** — FAQ: add `aria-controls`, `id` pairing between button and panel.
8. **A11** — BuyBox double-announcement: remove `role="status"` from floating confirmation bubble.
9. **A12** — GST toggle: add `aria-expanded` and `aria-controls`.
10. **A13** — Wire `aria-describedby` ↔ error `id` in the Field/Input pattern.
11. **P03** — Checkout: extract static form shell to SSR; push only interactive state to client.
12. **A15** — Add mobile navigation (hamburger drawer or bottom bar).

### Cleanup

13. **A06** — Mint badge: darken text to `#2e6640` inside `bg-mint/15` containers.
14. **A16** — Remove `role="list"` from `<ol>` in HowItWorks.
15. **N01** — Checkout terms links: add region prefix and use `<Link>`.
16. **N03** — Order confirmation: import orders service directly; remove HTTP self-call.
17. **P02** — Grain overlay: add `will-change: transform` to avoid compositing on scroll.
18. **P04** — Cart page: add SSR skeleton shell.
19. **P05** — CartCount: reserve badge space with `invisible` to prevent CLS.
20. **P06** — When real photos arrive: `next/image` with `priority` on hero.

---

*Generated by static code analysis. Contrast ratios calculated from design-token hex values using WCAG 2.1 relative luminance formula. No automated browser testing or screen-reader session was performed.*
