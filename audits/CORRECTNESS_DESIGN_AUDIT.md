# CHOP. Correctness, Design & Brand-Voice Audit

**Branch:** `feat/ecommerce-rebuild`  
**Audited:** 2026-05-30  
**Auditor:** Claude Sonnet 4.6 (automated)

---

## Executive Summary

The app is well-structured and the happy path for India COD orders works correctly. However, there is **one hard blocker** that breaks every online checkout: the `shippingAddress` field is sent as a plain `string` by the checkout client but the Zod validation schema expects `Record<string,string>` (an object). This causes a `400 Validation failed` on every checkout POST. Two additional high-severity issues exist: the sitemap generates wrong product URLs (`/products/` vs `/product/`), and the Terms/Privacy links at the checkout bottom bypass the region prefix, landing on non-existent routes. Several medium and low issues follow.

---

## End-to-End Purchase Flow Trace

```
Add to cart (BuyBox.handleAdd / handleBuyNow)
  → useCart.add({ productSlug, variantId, qty })          ✅ correct CartLine shape
  → cart persisted to localStorage via zustand/persist      ✅

Cart page (/[region]/cart)
  → resolveLines(lines, region) + computeTotals()           ✅
  → CouponField sets coupon state                           ✅
  → ButtonLink href="/{region}/checkout?coupon=..."         ✅

Checkout page (/[region]/checkout)
  → reads lines from useCart, resolves & re-computes        ✅
  → buildCheckoutPayload() → CheckoutPayload                ✅ items shape correct
  → callCheckout(payload) → POST /api/checkout              ✅ method, region, items, customer present

/api/checkout POST
  → checkoutSchema.safeParse(body)                          ❌ BLOCKER (see F-001)
  → recomputes totals server-side                           ✅
  → createOrder()                                           ✅
  → COD path → router.push(/{seg}/order/{code})             ✅
  → Razorpay path → runRazorpay() → callVerify()           ✅
  → Stripe path → runStripe() → redirects to returnUrl     ✅

/api/verify POST
  → Razorpay HMAC verification                              ⚠️  crash risk (see F-006)
  → markPaid()                                              ✅

/[region]/order/[code] (confirmation page)
  → fetchOrder() → GET /api/orders?code=                    ✅
  → /api/orders returns public-safe fields only             ✅
  → route shape matches OrderApiResponse interface          ✅
  → StatusStepper / OrderSummaryCard                        ✅

/[region]/track (TrackClient)
  → GET /api/orders?code=                                   ✅
  → FetchedOrder interface matches /api/orders response     ✅
  → region.shippingCopy from URL region not order region    ⚠️  cosmetic

VERDICT: Flow is BROKEN at /api/checkout due to F-001 (shippingAddress type mismatch).
         All other seam contracts are correct once that is fixed.
```

---

## BLOCKER Bugs

### B-1: `shippingAddress` type mismatch — checkout 400 on every order (CRITICAL)

- **File:** `lib/validation.ts:21`, `lib/checkout-client.ts:27`, `app/[region]/checkout/page.tsx:246`
- **Description:** The Zod schema declares `shippingAddress: z.record(z.string(), z.string()).optional()` (an object). The `CheckoutPayload` interface declares it `string`, and the checkout page sends `shippingAddress: address.trim()` — a plain string. Zod will reject this with a 400 validation error on every single checkout attempt. The order is never created. This is the most severe bug in the codebase.
- **Fix:** Either (a) change the schema to `z.string().optional()` and update `CreateOrderInput.shippingAddress` to `string | undefined`, or (b) restructure the checkout form to collect `{line1, city, state, postal, country}` fields and send an object. Option (a) is the fastest fix; option (b) is cleaner for the admin view which already assumes structured keys (`a.line1`, `a.city`, etc. at `app/admin/orders/[code]/page.tsx:134`). With option (a), the admin shipping section will always render blank.

---

## Findings Table

| ID | Sev | Dimension | Title | File:Line | Description | Fix |
|----|-----|-----------|-------|-----------|-------------|-----|
| F-001 | BLOCKER | Integration | `shippingAddress` schema vs client type mismatch | `lib/validation.ts:21`, `lib/checkout-client.ts:27`, `app/[region]/checkout/page.tsx:246` | Zod expects `Record<string,string>`, client sends `string`. 400 on every checkout POST. | Change schema to `z.string().optional()` or build structured address form |
| F-002 | HIGH | Data/Logic | Sitemap uses `/products/` but route is `/product/` | `app/sitemap.ts:47` | `absoluteUrl(\`/${region}/products/${product.slug}\`)` — all product URLs in sitemap 404. Correct path is `/product/[slug]`. | Change `products` → `product` at line 47 |
| F-003 | HIGH | Data/Logic | Checkout Terms/Privacy links bypass region prefix | `app/[region]/checkout/page.tsx:629-630` | `href="/terms"` and `href="/privacy"` — no region segment. Middleware won't match these as region pages; no route exists at `/terms`, result is 404. | Change to `href={\`/${seg}/terms\`}` and `href={\`/${seg}/privacy\`}` |
| F-004 | HIGH | Region | x-default hreflang wrong for `/in/*` pages | `lib/seo.ts:76-77` | `mirrorPath(path, "intl")` called with a `/in/…` path produces `/in/in/…` because the regex strips `/intl` prefix but the path starts with `/in`. x-default resolves to a double-prefixed, non-existent URL for all India pages. | Change line 77 to: `absoluteUrl(mirrorPath(path, region))` where `region` is the current page's region — that already computes the `/in` equivalent correctly. Or simpler: derive x-default as `absoluteUrl(path.replace(/^\/intl/, '/in'))` |
| F-005 | MEDIUM | Integration | `provider:"none"` response creates orphaned order with no user confirmation | `app/api/checkout/route.ts:111-118`, `app/[region]/checkout/page.tsx:271-275` | When Razorpay keys are unconfigured, the API creates the order then returns `provider:"none"`. The client hits `"Invalid payment session"` error and shows nothing — no order code, no WhatsApp fallback with the code. User is stuck. | When `provider` is `"none"`, return the order code to the client and route the user to the confirmation/WhatsApp fallback rather than surfacing a generic error |
| F-006 | MEDIUM | Data/Logic | `verifyRazorpaySignature` crashes (500) on malformed signature | `lib/payments/razorpay.ts:68` | `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))` — if `signature` is not a valid even-length hex string, `Buffer.from(sig)` produces a buffer of different byte-length than `expected` (32 bytes), causing `timingSafeEqual` to throw `ERR_CRYPTO_TIMINGSAFEEQUAL_LENGTH`. An attacker sending a 1-char signature gets a 500 instead of 400. | Add length guard: `if (a.length !== b.length) return false` before the `timingSafeEqual` call (same fix applies to `verifyWebhookSignature`) |
| F-007 | MEDIUM | Data/Logic | Order code format inconsistency in copy | `app/[region]/shipping/page.tsx:117`, `app/[region]/returns/page.tsx:84` | `generateOrderCode()` produces `CHOP-XXXXX-NNNN` (5 alphanumeric + 4 digits). Shipping page says `"CHOP-XXXXXXXX"` (8 chars, no internal dash). Returns page says `"CHOP-AB1234"` (no middle dash). Only TrackClient's `"CHOP-XXXXX-1234"` is correct. | Update shipping page and returns page copy to match actual format |
| F-008 | MEDIUM | Region | Hardcoded ₹ symbol in BuyBox COD strip | `components/product/BuyBox.tsx:207` | `₹{region.codFee / 100} COD fee` — hardcodes ₹ symbol. Guard `region.codAvailable` prevents this from showing for INTL, but if a future region has codAvailable=true with non-INR currency this would display wrong. | Use `formatMoney(region.codFee, region.id)` |
| F-009 | MEDIUM | Data/Logic | Hardcoded ₹999 in homepage metadata description | `app/[region]/page.tsx:34` | OG description for IN region hardcodes `"₹999"`. If the flagship product price changes, this description will be stale with no compile-time signal. | Derive from `hero.price[region.id]` using `formatMoney` |
| F-010 | MEDIUM | Data/Logic | Hardcoded `₹999` and `₹50` in FinalCTA and Terms copy | `components/home/sections.tsx:391`, `app/[region]/terms/page.tsx:73,119` | Same as F-009 but in rendered UI. Changes to pricing will cause inconsistency. | Use `formatMoney(PRODUCTS[0].price["in"], "in")` and `formatMoney(codFee, "in")` from regions config |
| F-011 | MEDIUM | Data/Logic | Rapid Peeler, Spice Grinder, Kadhai, Canister Set have no ≤4-star review | `lib/catalog.ts:82-83,143,175,207` | Brand standard requires every product page to include a real con (≤4-star review with a critical note). These four products show only 5-star reviews. The `Reviews` component correctly marks `isCon` for `rating < 5` but there's no such review to show. | Add one ≤4-star honest review per product (bowl size, capacity, or similar specific con) |
| F-012 | LOW | Design | `bg-white` used in HowItWorks cards and ReviewsStrip, deviating from palette | `components/home/sections.tsx:212,342` | HowItWorks step cards use `bg-white` instead of `bg-paper` or `bg-paper-2`. Reviews cards also `bg-white`. The design system paper color is `#FBF1E1`, not white. On warm-toned screens these appear noticeably colder and inconsistent with other cards. | Replace `bg-white` with `bg-paper` across these components |
| F-013 | LOW | Design | `bg-white` in ProductCard breaks palette consistency | `components/shop/ProductCard.tsx:21` | ProductCard uses `bg-white` background. Shop grid will appear inconsistent with the rest of the site. | Replace with `bg-paper` |
| F-014 | LOW | Region | Hardcoded WhatsApp number in order confirmation | `app/[region]/order/[code]/page.tsx:89` | COD next-steps CTA hardcodes `wa.me/919999999999` directly (not from `NEXT_PUBLIC_BUSINESS_WHATSAPP`). Other parts of the app correctly use the env var. | Replace with `process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "919999999999"` and build the URL dynamically (same pattern as checkout page) |
| F-015 | LOW | Integration | Razorpay webhook scans only `status="pending"` orders | `app/api/webhook/razorpay/route.ts:44` | `listOrders({ limit: 200, status: "pending" })` — if there are >200 pending orders, the webhook may miss a match. Stripe webhook has the same issue. | Look up orders by `providerOrderId` directly with a DB index query. The `orders_code_idx` index exists but there's no index on `provider_order_id`. Add an index and a `getOrderByProviderOrderId()` function. |
| F-016 | LOW | Data/Logic | Sitemap category URLs use query params instead of sub-paths | `app/sitemap.ts:34-36` | `/${region}/shop?category=${cat.id}` — but the actual route for category pages is `/${region}/shop/${cat.id}` (with `generateStaticParams`). These sitemap entries point to wrong URLs. | Change to `absoluteUrl(\`/${region}/shop/${cat.id}\`)` |
| F-017 | LOW | Voice | `CHOP-XXXXXXXX` order code example is wrong format | `app/[region]/shipping/page.tsx:117` | See F-007. Additionally the shipping page says to track using "your CHOP-XXXXXXXX order ID" — the format doesn't match the actual `CHOP-XXXXX-NNNN` pattern, confusing customers trying to track. | Update example to `CHOP-XXXXX-1234` |
| F-018 | INFO | Design | `#25D366` (WhatsApp green) is the only off-palette hex in rendered UI | `app/[region]/order/[code]/page.tsx:248` | One inline `bg-[#25D366]` for the WhatsApp CTA button — intentional brand color for WhatsApp. Acceptable but could be a CSS var `--color-wa-green` for consistency if more WhatsApp buttons are added. | Low priority; document the exception or add a token |
| F-019 | INFO | Data/Logic | TrackClient shows URL region's shipping copy, not order region | `app/[region]/track/TrackClient.tsx:242` | If a user in /intl/track looks up an India order, they see intl shipping copy. Minor cosmetic issue since the order data doesn't contain shipping copy. | Derive shipping copy from `order.region` instead of `useRegion()` |

---

## Cliché / Voice Offenders

Scanned all `.tsx` and `.ts` files for prohibited words: `seamless`, `game-changing`, `transformative`, `revolutionary`, `effortless`, `unleash`, `elevate`, `game-changer`. **Zero occurrences found.**

Voice is consistently first-person, present-tense, concrete throughout. Example standouts that are correct:
- `"Pull. Chop. Done."` — imperative, direct  
- `"Pyaaz, tamatar, dhaniya — prepped in ten seconds."` — concrete, no adjective inflation  
- `"As a bachelor who can barely cook, this saved me."` — real, not marketing

**No cliché violations detected.**

---

## Design Coherence Assessment

**What works well:**
- Button component (`components/ui/Button.tsx`) is used consistently across all pages — no rogue `<button className="...">` with custom styles outside the system.
- Radius tokens (`--radius-card: 14px`, `--radius-lg: 18px`) are consistently used via `rounded-[var(--radius-card)]`.
- Color palette is clean; the only off-palette color in component JSX is the intentional `#25D366` WhatsApp green (F-018).
- Font usage is coherent: `font-display` for headings throughout, `.display` utility class with `font-variation-settings` for hero-scale text.
- `Badge`, `Price`, `StarRating`, `Container` components are shared across all pages with no local reimplementations found.

**Inconsistencies found:**
- `bg-white` appears in `HowItWorks` step cards (sections.tsx:212), `ReviewsStrip` cards (sections.tsx:342), and `ProductCard` (ProductCard.tsx:21). These read as noticeably colder/whiter against the `#FBF1E1` cream background used everywhere else. Admin pages correctly use `bg-paper-2`. These three components look like they were built by a different author who didn't check the palette.
- Checkout page headings use `font-display` class (correct), product page headings use the `.display` CSS utility class — consistent in result but two authors chose different implementation paths. Both render Fraunces with variation settings but the `.display` class also applies `letter-spacing: -0.02em` and `line-height: 1` which the bare `font-display` class does not. Product page hero heading will have tighter tracking/leading than checkout headings. Minor but worth standardizing.
- `HowItWorks` cards are `bg-white rounded-[var(--radius-card)] border border-line p-8` while `FeaturedSection` product cards are `bg-white rounded-[var(--radius-card)] border border-line p-5`. The component-scoped padding varies by 12px, which is acceptable, but the `bg-white` deviation is not.

**Overall:** Site reads as one designed product at 80%, with the `bg-white` departures being the visible seam between agents. Fixing F-012 and F-013 would bring coherence to ~95%.

---

## Prioritized Fix List

1. **[P0] F-001** — Fix `shippingAddress` type mismatch. Checkout is broken for all orders. 30-minute fix.
2. **[P0] F-002** — Fix sitemap product URL (`/products/` → `/product/`). Broken URLs penalize SEO before launch.
3. **[P0] F-003** — Fix Terms/Privacy links in checkout footer to include region prefix.
4. **[P1] F-004** — Fix x-default hreflang for India pages (double `/in/in/` prefix).
5. **[P1] F-006** — Add length guard before `timingSafeEqual` in both Razorpay verification functions (security).
6. **[P1] F-016** — Fix sitemap category URLs to use path segments, not query params.
7. **[P2] F-005** — Handle `provider:"none"` gracefully; show order code and WhatsApp link.
8. **[P2] F-012/F-013** — Replace `bg-white` with `bg-paper` in HowItWorks, ReviewsStrip, ProductCard (design coherence).
9. **[P2] F-014** — Fix hardcoded WhatsApp number in order confirmation to use env var.
10. **[P2] F-007/F-017** — Fix order code format examples in shipping and returns pages.
11. **[P3] F-011** — Add one honest ≤4-star review per product (rapid-peeler, spice-grinder, kadhai, canisters).
12. **[P3] F-008/F-009/F-010** — Replace hardcoded ₹ amounts with `formatMoney()` calls from catalog/regions data.
13. **[P3] F-015** — Add DB index on `provider_order_id` and dedicated lookup function for webhook handlers.
14. **[P4] F-019** — TrackClient: use order.region for shipping copy, not URL region.
15. **[P4] F-018** — Optionally document the `#25D366` WhatsApp green as a named token.
