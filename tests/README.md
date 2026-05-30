# CHOP. Test Suite

Unit tests for the pure-logic library modules. No browser, no database, no network.

## Running tests

```bash
npm test          # single run
npm run test:watch # watch mode (re-runs on save)
npm run test:cov  # single run with V8 coverage report
```

## Directory structure

```
tests/
└── unit/
    ├── money.test.ts        lib/money.ts  (formatMoney, percentOff, priceFor)
    ├── regions.test.ts      lib/regions.ts (isRegionId, getRegion, regionForCountry)
    ├── utils.test.ts        lib/utils.ts  (generateOrderCode, slugify, cn)
    ├── catalog.test.ts      lib/catalog.ts (accessors + data-integrity assertions)
    └── cart-totals.test.ts  lib/cart/totals.ts (resolveLines, computeTotals, COUPONS)
```

## Conventions

- **Deterministic money tests**: `Intl.NumberFormat` can emit narrow no-break
  space (U+202F) or regular no-break space (U+00A0) depending on the host
  locale data. All tests normalize these to ASCII space before comparing.
- **generateOrderCode**: accepts an injected `rand` function so tests produce
  stable, repeatable codes without mocking `Math.random`.
- **No lib-source changes**: if a test reveals a bug in `lib/`, it is logged in
  the BUGS FOUND section below — not patched here.

## Coverage scope

`vitest.config.ts` covers `lib/**/*.ts` excluding server-only or React-context
modules that require jsdom (store, region-context, payments, orders, etc.).

## BUGS FOUND

None detected. All assertions match the documented behavior in the source files.
