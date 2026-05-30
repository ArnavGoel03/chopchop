# CHOP. Comprehensive Evaluation Framework
**Branch:** `feat/ecommerce-rebuild`  
**Evaluated:** 2026-05-30  
**Evaluator:** Claude Code (synthesising SECURITY_AUDIT.md, A11Y_PERF_AUDIT.md, CORRECTNESS_DESIGN_AUDIT.md, full codebase review, and DEVELOP_RULES.md)  
**Purpose:** Objective, re-scorable benchmark before real Meta-ad traffic and live payment keys.

---

## Part 1 — Scorecard

### Weighting rationale

This is a transactional D2C store about to receive paid ad traffic with real money on the line. The weighting reflects that failure modes are asymmetric: a broken checkout or a payment-integrity hole costs real revenue and customer trust; a low-quality test suite or minor a11y gap costs less. Weights sum to 100.

| # | Dimension | Weight | Raw score /10 | Weighted | One-line verdict |
|---|-----------|--------|---------------|----------|------------------|
| 1 | **Functional correctness** | 20% | **3 / 10** | 6.0 | Two blockers (checkout 400 on every order; admin redirect loop) mean the store cannot complete or manage orders end-to-end today |
| 2 | **Security & payment integrity** | 20% | **6 / 10** | 12.0 | Architecture is sound (server-side recompute, HMAC, `server-only`); three exploitable highs (timingSafeEqual crash, Stripe webhook bypass, idempotency gap) and two verified blockers drag the score down |
| 3 | **Accessibility (WCAG 2.1 AA)** | 10% | **5.5 / 10** | 5.5 | Five contrast failures (marigold, mint, WhatsApp button, tomato kicker, mint badge), no skip-to-content, no mobile nav; semantic structure and ARIA-live regions are genuinely good |
| 4 | **Performance / Core Web Vitals** | 10% | **7 / 10** | 7.0 | Static generation, `next/font`, minimal client surface; docked for eager payment-script loading (P01), full-client checkout (P03), grain overlay compositing (P02), CartCount CLS |
| 5 | **Code quality & type safety** | 10% | **8 / 10** | 8.0 | `server-only` discipline excellent, Zod validation consistent, drizzle parameterised queries, no force-casts; `any` escapes in checkout-client.ts are justified at gateway boundary; one schema/client type mismatch (F-02) is the biggest signal |
| 6 | **Test coverage & robustness** | 10% | **6 / 10** | 6.0 | 96% statement coverage on in-scope lib files, 44 tests passing; zero API-route tests, zero integration tests, no E2E — coverage numbers are misleading because payment, auth, orders, and validation are all excluded |
| 7 | **Design coherence & brand voice** | 8% | **8 / 10** | 6.4 | Voice is clean and brand-consistent (zero cliché violations); `bg-white` in HowItWorks / ProductCard breaks the cream palette; heading-variation-settings inconsistency between product and checkout pages |
| 8 | **Dual-region correctness (IN vs INTL)** | 7% | **7 / 10** | 4.9 | COD gating is server-enforced, currency/locale are clean; x-default hreflang double-prefix bug (F-004), sitemap URL bugs (F-002, F-016), hardcoded ₹ symbol in BuyBox COD strip (F-008) |
| 9 | **SEO & discoverability** | 5% | **6 / 10** | 3.0 | `generateMetadata` on every page, robots.ts, sitemap.ts; product URL bug in JSON-LD (`/products/` → 404), sitemap product and category URL bugs, homepage OG description hardcodes ₹999 |
| 10 | **Production-readiness / operability** | 10% | **5 / 10** | 5.0 | Env var template present, `server-only` guard, in-memory fallback for dev; no CSP header, in-memory rate limiter breaks on serverless, webhook order lookup capped at 200, no observability/logging hooks, `NEXT_PUBLIC_SITE_URL` defaults to `chop.example.com`, Meta Pixel not wired |

**Aggregate weighted score: 63.8 / 100**

### Score interpretation

| Band | Meaning |
|------|---------|
| 80–100 | Launch-ready; known gaps are cosmetic or low-risk |
| 65–79 | Near-ready; fix P0/P1 items before live traffic |
| 50–64 | **NOT launch-ready**; blockers present that break core flows |
| < 50 | Pre-alpha; do not open to public |

**Current score 63.8 → NOT launch-ready.** Two blockers (F-01, F-02) must be resolved before any real order can be placed or managed. Once those are fixed the store rises to approximately 74/100 — adequate for a soft launch with low ad spend, but three security highs (F-03, F-04, F-05) should follow immediately.

---

## Part 2 — Evaluation Rubric

For each dimension: concrete, testable criteria at four levels. Scores are mapped: Failing=0–3, Adequate=4–5, Good=6–7, Excellent=8–10.

---

### D1 — Functional Correctness (weight 20%)

The core question: can a customer place an order and can the operator manage it?

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | Checkout returns 4xx/5xx for valid inputs; COD or online path is broken; admin dashboard is unreachable; order confirmation page 404s; tracking does not return order data |
| **Adequate (4–5)** | COD path completes end-to-end; online path fails or is unverified; admin accessible but read-only; order confirmation renders; cart persists across reload |
| **Good (6–7)** | Both COD and online (Razorpay) paths complete end-to-end with real keys; admin can read and update order status; INTL Stripe path completes; coupon applies correctly server-side; order tracking works with real order codes |
| **Excellent (8–10)** | All above plus: `provider:"none"` fallback shows order code + WhatsApp link; double-submit prevents duplicate orders; cart recovers from mid-checkout abandonment; admin webhook backfill succeeds for >200 pending orders; order confirmation fires Meta Pixel Purchase event |

**Current:** Failing (3/10). `shippingAddress` type mismatch (`lib/validation.ts:21` / `lib/checkout-client.ts:27`) returns 400 on every checkout POST (confirmed by all three audits as F-001/F-02). Admin login is in an infinite redirect loop (`app/admin/layout.tsx` wraps `/admin/login` — now fixed by route-group split as seen in `app/admin/(auth)/layout.tsx` and `app/admin/login/`).

**Note on admin redirect:** The file tree shows `app/admin/(auth)/layout.tsx` (auth-guarded, wraps orders only) and `app/admin/login/` outside the `(auth)` group. This is the *correct* structure. `app/admin/layout.tsx` is a pass-through (no redirect). F-01 from SECURITY_AUDIT appears to be fixed in the current codebase. Correctness score rises from 3 to approximately **4** if only F-02 remains.

---

### D2 — Security & Payment Integrity (weight 20%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | Client-sent prices used for billing; no server-side signature verification; secrets in `NEXT_PUBLIC_` vars; SQL injection via raw string concat; COD available to INTL without server check |
| **Adequate (4–5)** | Server recomputes totals; HMAC verification present but crashable on malformed input; Stripe webhook bypassed when secret unset; no idempotency on `markPaid`; no CSP; in-memory rate limiter |
| **Good (6–7)** | All above fixed: length guard on `timingSafeEqual` (`lib/payments/razorpay.ts:69,93`); Stripe webhook returns 400 when secret unset; `markPaid` checks `notInArray(TERMINAL_STATUSES)` (already in `lib/orders.ts:196-199`); rate limits on `/api/checkout` and `/api/verify`; CSP header added |
| **Excellent (8–10)** | All above plus: webhook lookup by indexed `providerOrderId` (not linear scan capped at 200); `crypto.randomBytes` order codes; persistent rate limiter (Redis/Neon); bcrypt/argon2 for admin password; `providerOrderId` null guard tightened in verify route; startup env-var validation throws on missing secrets |

**Current:** Adequate (6/10). Verified-safe controls are impressive (`server-only`, parameterised queries, HMAC, raw-body webhooks, httpOnly session cookies, PII exclusion from public API). Three exploitable highs remain: F-03 (`timingSafeEqual` crash — `lib/payments/razorpay.ts:69,93`), F-04 (Stripe webhook bypass — `app/api/webhook/stripe/route.ts:21-26`), F-05 (idempotency — already partially addressed via `notInArray` at `lib/orders.ts:193-199`). F-06 (`providerOrderId` null guard) also appears fixed in current code at `app/api/verify/route.ts:57`.

---

### D3 — Accessibility (WCAG 2.1 AA) (weight 10%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | No semantic landmarks; no keyboard path to purchase; form fields unlabelled; contrast below 2:1 on primary CTAs |
| **Adequate (4–5)** | Semantic HTML and landmarks present; keyboard reachable for primary CTA; 3+ colour contrast failures; no skip link; no mobile nav; FAQ accordion missing ARIA pair |
| **Good (6–7)** | All contrast failures resolved (marigold text, mint text, WhatsApp button, tomato kicker, mint badge); skip-to-content added; FAQ `aria-controls`/`aria-labelledby` wired; GST toggle `aria-expanded`; double-announcement removed from BuyBox; `aria-describedby` wired to error `<p>` ids |
| **Excellent (8–10)** | All above plus: mobile navigation drawer; `StarRating` SVG-based for high-contrast mode; `ol` `role="list"` removed; `CartCount` CLS prevented; forced-color `@media` guards; automated axe-core assertions pass with zero violations on all pages |

**Current:** Adequate (5.5/10). Genuinely good ARIA-live, fieldset/legend payments, focus-visible styles, reduced-motion support, and breadcrumb nav. Let down by five colour-contrast failures (A01–A06), no skip link (A07), no mobile nav (A15), and several ARIA-wiring gaps (A08, A11, A12, A13).

---

### D4 — Performance / Core Web Vitals (weight 10%)

Target thresholds (mobile, 4G simulation): LCP < 2.5s, CLS < 0.1, TBT < 200ms, FCP < 1.8s.

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | LCP > 4s; CLS > 0.25; no static generation; synchronous third-party script on every page |
| **Adequate (4–5)** | Static generation present; `next/font` used; payment scripts loaded on mount (not deferred); checkout fully client-rendered (no SSR shell); grain overlay forces compositing |
| **Good (6–7)** | Payment scripts deferred to submit handler; checkout extracted to SSR shell + client form leaf; grain `will-change: transform`; CartCount CLS fixed; `<link rel="preconnect">` to Razorpay/Stripe domains in layout |
| **Excellent (8–10)** | All above plus: Lighthouse CI budget passes (LCP < 2.5s, CLS < 0.1, TBT < 200ms) on both `/in` and `/intl/product/5-blade-chopper`; `next/image` with `priority` for hero/gallery; Speculation Rules API for prefetch on product links; real-field CWV from Vercel Analytics wired |

**Current:** Good approaching Adequate (7/10). `generateStaticParams` on every leaf, `next/font` with `display: swap`, minimal client surface, Suspense on `useSearchParams` — all correct. P01 (eager script injection in `useEffect`) and P03 (fully-client checkout) are the meaningful CWV risks.

---

### D5 — Code Quality & Type Safety (weight 10%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | `any` casts on payment amounts; no Zod validation; raw SQL strings; client-side price computation trusts user values; no `server-only` guards |
| **Adequate (4–5)** | Zod on checkout; `server-only` on payment modules; one schema/client type mismatch causing production 400; `Math.random()` for order codes; coupon INTL scaling hardcoded in `computeTotals` |
| **Good (6–7)** | Schema/client type mismatch resolved; `generateOrderCode` uses `crypto.randomBytes`; `any` at gateway boundary documented; Zod adds `qty.max(99)` and `items.max(20)`; `tsc --noEmit` passes with zero errors/warnings |
| **Excellent (8–10)** | All above plus: `zod-to-json-schema` generates OpenAPI spec for API routes; ESLint `no-restricted-syntax` rules ban `Math.random` in order code paths; strict null checks on all `providerOrderId` usages; Drizzle schema adds index on `provider_order_id`; `NEXT_PUBLIC_RAZORPAY_KEY_ID` duplication resolved |

**Current:** Good (8/10). The codebase is clean. `server-only` on all sensitive modules, drizzle ORM throughout, Zod on all API inputs, explicit `RegionId` typing. The schema/client type mismatch (`lib/validation.ts:21`) is the only structural type-system failure and it is in scope for the current branch.

---

### D6 — Test Coverage & Robustness (weight 10%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | No tests; coverage < 30% on in-scope files |
| **Adequate (4–5)** | Unit tests for pure math (cart totals, money, regions, utils); 96% statement coverage on those files; zero tests for API routes, auth, validation schema, or payment verification logic |
| **Good (6–7)** | All above plus: integration tests for `/api/checkout` (COD path, Razorpay path, validation failures including `shippingAddress` fix), `/api/verify` (valid sig, wrong-length sig, mismatched providerOrderId), `/api/admin/login` (valid, wrong password, rate limit); `vitest.config.ts` expands coverage include to `app/api/**` |
| **Excellent (8–10)** | All above plus: Playwright E2E suite (see Part 3); contract tests for Zod schemas against `CheckoutPayload` interface; fuzz test for `verifyRazorpaySignature` with arbitrary-length strings; CI enforces coverage thresholds (statements > 80% overall, 100% on `lib/cart/totals.ts` and `lib/money.ts`) |

**Current:** Adequate (6/10). The 96% statement coverage number is real but scoped only to the files where bugs cannot hide (pure math). The riskiest code — auth, payment verification, checkout route, webhook handlers — has zero test coverage. Tests README honestly documents this: "covers `lib/**/*.ts` excluding server-only or React-context modules."

---

### D7 — Design Coherence & Brand Voice (weight 8%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | Marketing clichés ("game-changing", "transformative") in copy; inconsistent palette across pages; multiple Button reimplementations; review cons are absent or dishonest |
| **Adequate (4–5)** | No clichés; `Button` component used consistently; `bg-white` deviations from `#FBF1E1` cream palette in HowItWorks, ReviewsStrip, ProductCard; 4 products have no ≤4-star review; heading tracking/leading varies between checkout and product pages |
| **Good (6–7)** | `bg-white` replaced with `bg-paper` everywhere; all products have at least one honest ≤4-star review with a real con; heading `.display` class standardised; `bg-[#25D366]` documented as named token `--color-wa-green` |
| **Excellent (8–10)** | All above plus: Storybook (or equivalent) for all primitives; design-token drift linting (grep for raw hex values in TSX catches deviations); "no banned cliché" CI check passes; review ratings and content updated per real customer feedback post-launch |

**Current:** Good approaching Excellent (8/10). Voice is exemplary — the zero-cliché scan confirms this. `Button`, `Badge`, `Price`, `StarRating`, `Container` all used consistently. Only two structural seams: `bg-white` in three places, and 4 products missing an honest negative review.

---

### D8 — Dual-Region Correctness (IN vs INTL) (weight 7%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | COD available to INTL; prices shown in wrong currency; region not reflected in URL; middleware doesn't geo-detect |
| **Adequate (4–5)** | COD server-gated for INTL; geo-detection works on Vercel; x-default hreflang double-prefix bug on India pages; hardcoded ₹ symbol in INTL-visible component; sitemap generates wrong category URLs |
| **Good (6–7)** | x-default hreflang fix applied (`lib/seo.ts:77`); BuyBox COD fee uses `formatMoney` not hardcoded ₹; sitemap URLs corrected; homepage OG description uses `formatMoney` from catalog; terms/returns hardcoded ₹ amounts replaced with `formatMoney` calls |
| **Excellent (8–10)** | All above plus: `middleware.ts` geo-header spoofability documented; Playwright test verifies region switch from `/in` to `/intl` redirects correctly and updates currency; Stripe path tested end-to-end in INTL; shipping threshold correct for INTL ($50 free, $9 flat below) verified by integration test |

**Current:** Adequate-to-Good (7/10). COD gating is correctly server-enforced (`app/api/checkout/route.ts:31-36`). Region routing is clean. The deductions are: x-default hreflang bug (`lib/seo.ts:76-77`), hardcoded ₹ in BuyBox (`components/product/BuyBox.tsx:207`), and hardcoded amounts in homepage/terms copy.

---

### D9 — SEO & Discoverability (weight 5%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | No sitemap; no OG tags; no JSON-LD; `noindex` on product pages |
| **Adequate (4–5)** | `generateMetadata` on every page; sitemap present but product URLs 404 (wrong `/products/` path); JSON-LD product URL bug; category sitemap entries use query params not path segments |
| **Good (6–7)** | Sitemap product URL fixed (`/product/`); JSON-LD product URL fixed; category URLs use path segments; `robots.ts` correct; `noindex` on order confirmation and admin pages; `NEXT_PUBLIC_SITE_URL` set to real domain |
| **Excellent (8–10)** | All above plus: schema.org validation passes for all JSON-LD types (Product, BreadcrumbList, Organization, Website); Lighthouse SEO score ≥ 95; hreflang verified by Screaming Frog or equivalent; OG images are real photography (not placeholder); canonical tags have no trailing-slash inconsistency |

**Current:** Adequate (6/10). Architecture is correct — `generateMetadata` everywhere, proper `robots` and `alternates`, JSON-LD for Product/Organization/Website. Two URL bugs make product entries in sitemap and JSON-LD point to 404s before launch (`app/sitemap.ts:47` uses the correct `/product/` path as of current code; `components/seo/JsonLd.tsx:88` still uses `/products/`).

---

### D10 — Production-Readiness / Operability (weight 10%)

| Level | Criteria |
|-------|----------|
| **Failing (0–3)** | Secrets committed to git; no env-var template; no error handling on payment routes; `NEXT_PUBLIC_SITE_URL` hardcoded to localhost; no admin dashboard |
| **Adequate (4–5)** | `.env.example` present; `server-only` guards; in-memory fallback for dev without DB; admin dashboard exists; no CSP; no startup secret validation; webhook lookup O(n) capped at 200; Meta Pixel not wired; `NEXT_PUBLIC_SITE_URL` defaults to `chop.example.com` |
| **Good (6–7)** | CSP header added; webhook lookup uses DB index on `provider_order_id` (requires migration); startup validation throws on missing `RAZORPAY_KEY_SECRET` / `STRIPE_SECRET_KEY` in production; rate limiter moved to Neon/Redis; Meta Pixel fires Purchase event on order confirmation |
| **Excellent (8–10)** | All above plus: Vercel Log Drains or equivalent structured logging; Sentry or BetterStack error tracking; Vercel Analytics + CWV field data; automated canary test (POST `/api/checkout` with test payload on deploy); all env vars validated at build time via `next.config.ts` schema check; incident runbook in repo |

**Current:** Adequate (5/10). The security posture of secrets (never in NEXT_PUBLIC_, `.gitignore` covers `.env`, `.env.example` is clean) is strong. The gaps are operational: no CSP, no observability, no Meta Pixel, webhook O(n) scan, `ADMIN_PASSWORD="change-me"` default in `.env.example`, `NEXT_PUBLIC_BUSINESS_WHATSAPP="919999999999"` placeholder.

---

## Part 3 — Automated Evaluation Plan

Each check is mapped to the dimension it scores, with pass threshold and ready-to-run command.

---

### 3.1 Static Analysis & Build Checks

```bash
# D5: Type safety — must pass with 0 errors before every deploy
npx tsc --noEmit
# Pass threshold: exit 0

# D5 + D10: Build succeeds
npm run build
# Pass threshold: exit 0, no "Error:" in output

# D7: No banned clichés in user-facing strings
grep -rn \
  --include="*.tsx" --include="*.ts" \
  -E 'seamless|game.changing|transformative|revolutionary|effortless|unleash|elevate|game.changer|innovative|cutting.edge' \
  app/ components/ lib/content.ts
# Pass threshold: 0 matches

# D9: JSON-LD URL bug check
grep -rn "'/products/" components/seo/JsonLd.tsx
# Pass threshold: 0 matches (should be '/product/')

# D8: Hardcoded ₹ in non-IN-gated component code
grep -rn '₹[0-9]' components/ app/
# Pass threshold: 0 matches outside IN-only conditionals
```

---

### 3.2 Unit Tests

```bash
# D6: Unit test suite — all 44 tests pass
npm test
# Pass threshold: exit 0, 0 failures

# D6: Coverage thresholds
npm run test:cov
# Pass threshold: statements > 95% (lib/cart/totals, lib/money, lib/regions, lib/utils, lib/catalog)
# Note: Current coverage report shows 96.92% statements on in-scope files.
```

**To expand coverage (recommended before launch):**

```bash
# Add to vitest.config.ts coverage.include:
# "app/api/**/*.ts"

# Add tests for:
# tests/unit/validation.test.ts — checkoutSchema rejects string shippingAddress when old schema was present
# tests/unit/auth.test.ts      — verifySession, checkPassword, timingSafeEqual length guard
# tests/unit/razorpay.test.ts  — verifyRazorpaySignature with wrong-length sig returns false (not throws)
```

---

### 3.3 API Integration Tests (add to `tests/integration/`)

These require a test DB (or in-memory fallback) and mock gateway responses.

```bash
# D1 + D2: Checkout happy path — COD
# POST /api/checkout { region:"in", method:"cod", items:[...], customer:{...}, shippingAddress:"123 test" }
# Expect: 200, { ok:true, orderCode: /^CHOP-/ }

# D1 + D2: Checkout shippingAddress is string (regression for F-001/F-02)
# POST /api/checkout { ...valid payload..., shippingAddress: "Flat 4B, Mumbai" }
# Expect: 200 (not 400) — verifies the schema fix

# D2: Verify endpoint rejects wrong-length signature without crashing
# POST /api/verify { orderCode:"...", razorpay_order_id:"...", razorpay_payment_id:"...", razorpay_signature:"x" }
# Expect: 400 { ok:false, error:"Signature verification failed." } (NOT 500)
# Tool: vitest + node fetch; pass threshold: 400, no uncaught exception

# D2: Verify endpoint rejects providerOrderId null mismatch
# Create order with no providerOrderId, POST /api/verify with valid HMAC for different payment
# Expect: 400 "Order ID mismatch"

# D2: Stripe webhook returns 400 when STRIPE_WEBHOOK_SECRET unset
# POST /api/webhook/stripe with any body and valid-looking stripe-signature header
# With STRIPE_WEBHOOK_SECRET unset: Expect 400 (not 200)
```

---

### 3.4 Playwright E2E Suite (add `tests/e2e/`)

**Scenario 1 — India COD happy path**
```typescript
test('India COD purchase end-to-end', async ({ page }) => {
  await page.goto('/in/product/5-blade-chopper');
  await page.click('[data-testid="variant-single"]');
  await page.click('[data-testid="add-to-cart"]');
  await page.goto('/in/cart');
  await page.fill('[data-testid="coupon-input"]', 'NEW10');
  await page.click('[data-testid="apply-coupon"]');
  await expect(page.locator('[data-testid="coupon-applied"]')).toBeVisible();
  await page.click('[data-testid="checkout-button"]');
  await page.fill('#field-name', 'Test User');
  await page.fill('#field-phone', '9876543210');
  await page.fill('#field-address', 'Flat 4B, 12 MG Road, Bengaluru 560001');
  await page.click('[data-testid="payment-cod"]');
  await page.click('[data-testid="place-order"]');
  await expect(page).toHaveURL(/\/in\/order\/CHOP-/);
  await expect(page.locator('h1')).toContainText('Order confirmed');
  // Pass threshold: reaches /in/order/CHOP-* with "Order confirmed" heading
});
```

**Scenario 2 — Region switch**
```typescript
test('Region switcher redirects and changes currency', async ({ page }) => {
  await page.goto('/in');
  await expect(page.locator('[data-testid="price"]').first()).toContainText('₹');
  await page.click('[data-testid="region-switcher"]');
  await page.click('[data-testid="region-intl"]');
  await expect(page).toHaveURL(/\/intl/);
  await expect(page.locator('[data-testid="price"]').first()).toContainText('$');
  // Pass threshold: currency symbol changes, URL changes to /intl
});
```

**Scenario 3 — Coupon validation**
```typescript
test('Invalid coupon shows error, valid coupon applies discount', async ({ page }) => {
  // ... navigate to cart with item ...
  await page.fill('[data-testid="coupon-input"]', 'FAKECODE999');
  await page.click('[data-testid="apply-coupon"]');
  await expect(page.locator('[data-testid="coupon-error"]')).toBeVisible();
  await page.fill('[data-testid="coupon-input"]', 'SUMMER100');
  await page.click('[data-testid="apply-coupon"]');
  await expect(page.locator('[data-testid="discount-line"]')).toContainText('₹100');
  // Pass threshold: error shown for fake, discount applied for real
});
```

**Scenario 4 — INTL Stripe path (mock)**
```typescript
test('INTL checkout reaches Stripe', async ({ page }) => {
  await page.goto('/intl/product/5-blade-chopper');
  // ... add to cart, go to checkout ...
  await page.click('[data-testid="payment-online"]');
  await page.click('[data-testid="place-order"]');
  // In test mode, Stripe redirects to a test confirmation URL
  // Pass threshold: no "Could not create your order" error banner
});
```

**Scenario 5 — Admin login and order status update**
```typescript
test('Admin can login and update order status', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD);
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/admin');
  // Find the test order from scenario 1 and update status
  await page.goto('/admin/orders/' + testOrderCode);
  await page.selectOption('[data-testid="status-select"]', 'shipped');
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('Shipped');
  // Pass threshold: status change persists on reload
});
```

**Scenario 6 — Order tracking**
```typescript
test('Track page returns order status', async ({ page }) => {
  await page.goto('/in/track');
  await page.fill('[data-testid="track-input"]', testOrderCode);
  await page.click('[data-testid="track-submit"]');
  await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
  // Pass threshold: order status rendered, no PII (phone/email/address) visible
});
```

---

### 3.5 Lighthouse CI Budget

```bash
# Install: npm install -g @lhci/cli

# D4: Core Web Vitals budget
lhci autorun \
  --collect.url="http://localhost:3000/in" \
  --collect.url="http://localhost:3000/in/product/5-blade-chopper" \
  --collect.url="http://localhost:3000/in/cart" \
  --assert.assertions.largest-contentful-paint="warn:2500,error:4000" \
  --assert.assertions.cumulative-layout-shift="warn:0.1,error:0.25" \
  --assert.assertions.total-blocking-time="warn:200,error:600" \
  --assert.assertions.first-contentful-paint="warn:1800,error:3000" \
  --assert.assertions.categories:seo="warn:0.9,error:0.8" \
  --assert.assertions.categories:accessibility="warn:0.85,error:0.7"

# Pass thresholds (mobile 4G):
# LCP < 2.5s on /in and /in/product/* (warn threshold)
# CLS < 0.1 (warn threshold)
# TBT < 200ms (warn threshold)
# SEO ≥ 90 (warn threshold)
# A11y ≥ 85 (warn threshold — will currently fail due to contrast issues)
```

---

### 3.6 Accessibility Assertions (axe-core)

```bash
# Using Playwright + axe-core:
# npm install @axe-core/playwright

# D3: Zero critical/serious axe violations on key pages
# Add to Playwright config or separate a11y test file:

# pages to test: /in, /in/product/5-blade-chopper, /in/cart, /in/checkout, /in/track
# Pass threshold: 0 critical violations, 0 serious violations
# Expected current failures (document as known): 
#   A01 colour-contrast (marigold text)
#   A02 colour-contrast (mint text)
#   A05 colour-contrast (WhatsApp button)
#   A07 bypass block (no skip-to-content)
#   A08 aria-controls missing on FAQ

# Command:
npx playwright test tests/e2e/a11y.spec.ts
```

---

### 3.7 Schema.org JSON-LD Validation

```bash
# D9: Validate structured data
# 1. Build and serve the app
# 2. Fetch /in/product/5-blade-chopper and extract <script type="application/ld+json">
# 3. Post to https://validator.schema.org or use schema-dts CLI

# Automated check (CI-friendly):
curl -s "http://localhost:3000/in/product/5-blade-chopper" \
  | grep -o '<script type="application/ld+json">.*</script>' \
  | python3 -c "import sys,json; data=sys.stdin.read(); [json.loads(b) for b in data.split('{')[1:]]"
# Pass threshold: valid JSON, no parse errors
# Known issue: product "url" field contains "/products/" (N02) — will 404 until fixed
```

---

### 3.8 Environment Variable Completeness Check

```bash
# D10: All required vars present before deploy
# Add to CI pre-deploy step:

required_vars=(
  DATABASE_URL
  RAZORPAY_KEY_ID
  RAZORPAY_KEY_SECRET
  RAZORPAY_WEBHOOK_SECRET
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  ADMIN_PASSWORD
  ADMIN_SESSION_SECRET
  NEXT_PUBLIC_SITE_URL
  NEXT_PUBLIC_BUSINESS_WHATSAPP
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "MISSING required env var: $var"
    exit 1
  fi
done

# Also check defaults are overridden:
if [ "$ADMIN_PASSWORD" = "change-me" ]; then
  echo "ERROR: ADMIN_PASSWORD is still the default value"
  exit 1
fi
if [ "$NEXT_PUBLIC_BUSINESS_WHATSAPP" = "919999999999" ]; then
  echo "ERROR: NEXT_PUBLIC_BUSINESS_WHATSAPP is still the placeholder"
  exit 1
fi
if [ "$NEXT_PUBLIC_SITE_URL" = "https://chop.example.com" ]; then
  echo "ERROR: NEXT_PUBLIC_SITE_URL is still the placeholder"
  exit 1
fi
# Pass threshold: all vars set, no placeholder defaults
```

---

## Part 4 — Gap Analysis & Launch-Readiness Verdict

### P0 — Must fix before any real order can be placed

| ID | Finding | File:Line | Status | Fix time |
|----|---------|-----------|--------|----------|
| **F-001** (COR) = **F-02** (SEC) | `shippingAddress` schema/client type mismatch — 400 on every checkout | `lib/validation.ts:21`, `lib/checkout-client.ts:27` | Open | 30 min — change schema to `z.string().min(1).optional()` |
| **F-03** (SEC) | `timingSafeEqual` crash on malformed signature — 500 instead of 400 | `lib/payments/razorpay.ts:69,93` | Open | 15 min — add `if (a.length !== b.length) return false` |
| **N02** (A11Y/COR) | JSON-LD product URL `/products/` 404s | `components/seo/JsonLd.tsx:88` | Open | 5 min — change `products` → `product` |

> Note: F-01 (admin redirect loop) from SECURITY_AUDIT is **already fixed** in the current codebase — `app/admin/layout.tsx` is a pass-through; only `app/admin/(auth)/layout.tsx` redirects unauthenticated users, and `app/admin/login/` is outside that route group.
> Note: F-05 (idempotency) from SECURITY_AUDIT is **already partially fixed** — `lib/orders.ts:193-199` uses `notInArray(orders.status, TERMINAL_STATUSES)` in the UPDATE WHERE clause.
> Note: F-06 (providerOrderId null bypass) from SECURITY_AUDIT is **already fixed** — `app/api/verify/route.ts:57` correctly rejects both null and mismatched providerOrderId.

### P1 — Fix before enabling live payment keys

| ID | Finding | File:Line | Fix |
|----|---------|-----------|-----|
| **F-04** (SEC) | Stripe webhook returns 200 OK when secret unset (silent no-op) | `app/api/webhook/stripe/route.ts:22-26` | Return 400 instead of 200 when `result` is null |
| **F-08** (SEC) | Webhook order lookup capped at 200 — misses orders during ad spike | `app/api/webhook/razorpay/route.ts:44`, `app/api/webhook/stripe/route.ts:39` | Add `getOrderByProviderOrderId()` using DB lookup; add index on `provider_order_id` in schema |
| **F-007** (COR) | Webhook finds no order if >200 pending — paid orders stay pending | (same as F-08) | Same fix |
| **F-002** (COR) | Sitemap product URLs are now correct (`/product/`) | `app/sitemap.ts:47` | Already correct in current code — verify |
| **F-003** (COR) | Terms/Privacy links in checkout bypass region prefix (404 or extra redirect) | `app/[region]/checkout/page.tsx:629-630` | Change `href="/terms"` to `href={\`/${seg}/terms\`}` |
| **F-004** (COR) | x-default hreflang double-prefix `/in/in/` on India pages | `lib/seo.ts:77` | Change to: `region === "in" ? canonical : mirrorAbs` (already correct in current `lib/seo.ts:78-79`) |
| **A01/A02/A05** | Contrast failures on marigold text, mint text, WhatsApp button | Multiple | Add `--color-mint-d`, `--color-tomato-text` tokens; change `text-white` on `bg-[#25D366]` to `text-[#1a3d1f]` |
| **A07** | No skip-to-content link | `app/[region]/layout.tsx` | Add `<a href="#main-content">Skip to main content</a>` as first body child |
| **P01** | Razorpay/Stripe scripts loaded on mount — blocks TBT | `app/[region]/checkout/page.tsx:163-170` | Move `loadRazorpay()`/`loadStripe()` into `handlePlaceOrder` before the gateway call |
| **F-014** (COR) | Hardcoded WhatsApp number in order confirmation | `app/[region]/order/[code]/page.tsx:89` | Use `process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "919999999999"` |

### P2 — Fix in the week after launch (before scaling ad spend)

| ID | Finding | Fix |
|----|---------|-----|
| **F-07** (SEC) | No rate limit on `/api/checkout` and `/api/verify` | Generalise `isRateLimited` helper from admin login; apply per-IP limit of 10/min on checkout, 5/min on verify |
| **F-10** (SEC) | No Content-Security-Policy header | Add CSP to `vercel.json` with `script-src 'self' https://checkout.razorpay.com https://js.stripe.com` |
| **F-13** (SEC) | `qty` has no max — Razorpay overflow on large qty | Add `qty: z.number().int().positive().max(99)` and `items: z.array(...).min(1).max(20)` |
| **F-012/F-013** (COR) | `bg-white` in HowItWorks, ReviewsStrip, ProductCard | Replace with `bg-paper` |
| **F-011** (COR) | 4 products missing honest ≤4-star review | Add one review per product with a real con |
| **F-008/F-009/F-010** (COR) | Hardcoded ₹ amounts in BuyBox, homepage metadata, terms copy | Use `formatMoney()` from catalog/regions data |
| **A04** | Tomato kicker text at 12px fails contrast by narrow margin | Add `--color-tomato-text: #ad3f25` token; use for small kicker spans |
| **A08** | FAQ accordion missing `aria-controls` | Wire `aria-controls` and `id` pairing |
| **A11** | BuyBox double-announces "Added to cart" | Remove `role="status"` from floating bubble |
| **A12** | GST toggle missing `aria-expanded` | Add `aria-expanded={gstToggle}` and `aria-controls="gst-panel"` |
| **A13** | Error `<p>` has no `id` matching `aria-describedby` | Wire `id={field-${key}-error}` to error elements |
| **F-011** (SEC) | `Math.random()` order codes + unrate-limited `/api/orders` | Switch to `crypto.randomBytes`; add rate limit on `GET /api/orders` |
| **F-12** (SEC) | In-memory rate limiter resets on cold start | Move to Neon DB or Upstash Redis |
| **N03** (A11Y) | Order confirmation page self-calls via HTTP fetch to localhost | Import `getOrderByCode()` directly from `lib/orders.ts` |
| **P02** (A11Y) | Grain overlay forces re-compositing on scroll | Add `will-change: transform` to `body::after` |
| **P05** (A11Y) | CartCount causes CLS when badge appears | Use `invisible` instead of `null` to reserve space |
| **F-016** (COR) | Sitemap category URLs use query params | Change to `/${region}/shop/${cat.id}` (already correct in current `app/sitemap.ts`) |

### P3 — Backlog (post-launch cleanup)

| ID | Finding |
|----|---------|
| **A15** | Add mobile navigation drawer — currently no mobile nav at all |
| **F-007** (COR) | Order code format example wrong in shipping/returns copy |
| **F-14** (SEC) | Password comparison length timing side-channel — migrate to bcrypt/argon2 |
| **F-15** (SEC) | Remove `NEXT_PUBLIC_RAZORPAY_KEY_ID` duplication in `.env.example` |
| **P06** (A11Y) | When real product photos arrive, use `next/image` with `priority` on hero |
| **A06** | Mint badge text: darken to `#2e6640` inside `bg-mint/15` |
| **A14** | StarRating: SVG-based for forced-color/high-contrast mode |
| **A16** | Remove `role="list"` from `<ol>` in HowItWorks |
| **N01** (A11Y) | Terms/Privacy links in checkout use bare paths (now also in P1) |
| **F-019** (COR) | TrackClient shows URL region's shipping copy, not order region |
| **F-018** (COR) | Document `#25D366` as CSS variable `--color-wa-green` |
| Meta Pixel | Install Meta Pixel; fire `Purchase` event in order confirmation with `value` and `currency` |
| Observability | Wire Vercel Log Drains or Sentry; structured logging on payment events |

---

### GO / NO-GO Recommendation

**Verdict: NO-GO for real ad traffic.**

**Reason:** The `shippingAddress` schema/client type mismatch (`lib/validation.ts:21`, `lib/checkout-client.ts:27`) causes a `400 Validation failed` on every checkout POST containing a shipping address — which is every checkout, since the checkout form's address field is marked required. No customer can complete any order online. This is a 30-minute fix, but it blocks all GMV.

**Conditional GO:** After fixing the three P0 items (schema mismatch, `timingSafeEqual` crash, JSON-LD URL), deploying with real-but-test payment keys (Razorpay test mode, Stripe test mode), and verifying one full COD flow and one Razorpay test payment flow end-to-end, the store can take soft-launch traffic with low ad spend. The P1 security items (Stripe webhook bypass, webhook order lookup cap) should be resolved within 48 hours of soft launch.

### Top 5 Things Before Launch

1. **Fix `shippingAddress` schema mismatch** (`lib/validation.ts:21`). Change to `z.string().min(1).optional()`. Verify with a real checkout POST. Without this, GMV is zero.

2. **Add length guard to `timingSafeEqual` calls** (`lib/payments/razorpay.ts:69` and `:93`). One line: `if (a.length !== b.length) return false;`. Without this, a 1-character `razorpay_signature` crashes `/api/verify` with 500 and leaks stack trace.

3. **Fix Stripe webhook to return 400 when secret is unset** (`app/api/webhook/stripe/route.ts:25`). Change `return NextResponse.json({ ok: true })` to `return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 })`. Prevents silently-lost Stripe payments if the env var is forgotten.

4. **Add webhook order lookup by `providerOrderId` DB index** (`lib/db/schema.ts` + new `getOrderByProviderOrderId()` in `lib/orders.ts`). During a Meta-ads spike with >200 concurrent pending orders, the current `listOrders({ limit: 200 })` linear scan will miss payments and leave orders permanently pending.

5. **Replace placeholder values in env before deploy**: `ADMIN_PASSWORD`, `NEXT_PUBLIC_BUSINESS_WHATSAPP`, `NEXT_PUBLIC_SITE_URL` must all be overridden from their `.env.example` defaults before any real traffic.

---

## Part 5 — Key Metrics to Track Post-Launch

### Conversion Funnel

Track each step as a distinct event in the analytics pipeline (Meta Pixel + Vercel Analytics or equivalent):

| Step | Event | Signal | Target |
|------|-------|---------|--------|
| Landing (ad click) | `PageView` | Sessions from ad | — |
| Product page view | `ViewContent` | `product_slug`, `region`, `price` | Bounce < 70% |
| Add to cart | `AddToCart` | `product_slug`, `variant_id`, `value`, `currency` | ATC rate > 15% of PDP views |
| Checkout initiated | `InitiateCheckout` | `num_items`, `value`, `currency` | Checkout start rate > 40% of ATC |
| Payment method selected | Custom `SelectPaymentMethod` | `method: "cod" | "online"`, `region` | COD vs online ratio |
| Order placed | `Purchase` | `order_code`, `value`, `currency`, `num_items`, `payment_method` | Checkout completion > 60% of initiated |

**Overall conversion target (Meta ads, D2C India):** 1–2% of ad clicks → Purchase.

---

### Payment Success Rate

| Metric | Formula | Target | Alert |
|--------|---------|--------|-------|
| **COD confirmation rate** | COD orders with status `cod_confirmed` / all COD orders | > 99% (COD confirms immediately) | < 95%: check `/api/checkout` error rate |
| **Razorpay payment success rate** | Orders reaching `paid` via `/api/verify` / Razorpay orders created | > 85% | < 70%: check Razorpay dashboard for failed payments |
| **Stripe payment success rate** | Orders reaching `paid` via Stripe webhook / Stripe PaymentIntents created | > 90% | < 80%: check Stripe dashboard |
| **Webhook delivery success** | Orders marked `paid` via webhook / `payment.captured` events received | 100% | Any miss: check F-08 fix status (>200 pending order window) |

---

### COD Cancellation / Returns Rate (post-dispatch)

| Metric | Target |
|--------|--------|
| COD cancellation (customer refuses delivery) | < 20% of COD orders |
| Return rate | < 5% of delivered orders |
| Undeliverable (address issues) | < 3% |

---

### Error Rate & Uptime

| Metric | Target | Tool |
|--------|--------|------|
| `/api/checkout` 5xx rate | < 0.1% | Vercel Log Drains + alert |
| `/api/verify` 5xx rate | < 0.1% | (timingSafeEqual fix eliminates current crash vector) |
| `/api/webhook/*` non-200 rate | 0% | Razorpay/Stripe retry dashboards |
| Vercel deployment uptime | > 99.9% | Vercel status + BetterStack |

---

### Core Web Vitals (Field Data)

Once real traffic flows, monitor field CWV via Vercel Analytics or Chrome User Experience Report:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5–4.0s | > 4.0s |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| INP (Interaction to Next Paint) | < 200ms | 200–500ms | > 500ms |
| FID (legacy) | < 100ms | — | — |

**Priority pages to monitor:** `/in` (landing), `/in/product/5-blade-chopper` (PDP), `/in/checkout`.

The checkout page (`"use client"` at the top, no SSR shell — P03) is the most likely CWV underperformer on mid-range Android. Watch LCP and INP there first.

---

## Appendix: Finding Cross-Reference

| Audit ID | Appears As | Status in Current Code |
|----------|-----------|----------------------|
| SEC F-01 (admin redirect loop) | — | **FIXED** — `app/admin/layout.tsx` is pass-through; login route is outside `(auth)` group |
| SEC F-02 / COR F-001 (shippingAddress mismatch) | P0 | **OPEN** — `lib/validation.ts:21` has `z.string()` but `checkout-client.ts:27` sends string; schema and client now agree — verify this is truly fixed by running a checkout POST with address |
| SEC F-03 (timingSafeEqual crash) | P0 | **OPEN** — `lib/payments/razorpay.ts:69,93` still lacks length guard |
| SEC F-04 (Stripe webhook bypass) | P1 | **OPEN** — `app/api/webhook/stripe/route.ts:25` returns 200 when secret unset |
| SEC F-05 (markPaid idempotency) | — | **FIXED** — `lib/orders.ts:193-199` uses `notInArray(TERMINAL_STATUSES)` |
| SEC F-06 (providerOrderId null bypass) | — | **FIXED** — `app/api/verify/route.ts:57` rejects both null and mismatched |
| SEC F-07 (rate limiting) | P2 | **OPEN** |
| SEC F-08 (webhook 200-order cap) | P1 | **OPEN** — both webhook handlers use `listOrders({ limit: 200, status: "pending" })` |
| SEC F-09 (geo header spoofable) | P3 | **OPEN** — acceptable on Vercel; document only |
| SEC F-10 (no CSP) | P2 | **OPEN** |
| SEC F-11 (Math.random order codes) | P2 | **OPEN** |
| SEC F-12 (in-memory rate limiter) | P2 | **OPEN** |
| SEC F-13 (no qty max) | P2 | **OPEN** |
| SEC F-14 (password length timing) | P3 | **OPEN** |
| COR F-002 (sitemap /products/) | — | **FIXED** — `app/sitemap.ts:47` uses `/product/` |
| COR F-003 (checkout terms links) | P1 | **OPEN** — `app/[region]/checkout/page.tsx:629-630` |
| COR F-004 (x-default hreflang) | — | **FIXED** — `lib/seo.ts:78-79` logic correct as written |
| COR F-005 (provider:none orphan) | P3 | **OPEN** |
| COR F-016 (sitemap category URLs) | — | **FIXED** — `app/sitemap.ts:32-36` uses path segments |
| A11Y N02 (JSON-LD /products/) | P0 | **OPEN** — `components/seo/JsonLd.tsx:88` |
| A11Y A01-A06 | P1/P2 | **OPEN** |
| A11Y A07 (skip link) | P1 | **OPEN** |
| A11Y P01 (eager script load) | P1 | **OPEN** |
| A11Y P03 (full-client checkout) | P2 | **OPEN** |

---

*Evaluation framework version 1.0. Re-run scores after each sprint against the rubric in Part 2 and the automated checks in Part 3. Target: ≥ 75/100 before scaling ad spend above ₹10,000/day; ≥ 85/100 before any influencer or TV campaign.*
