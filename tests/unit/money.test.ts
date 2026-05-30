import { describe, it, expect } from "vitest";
import { formatMoney, percentOff, priceFor } from "@/lib/money";
import { REGIONS } from "@/lib/regions";

// Intl.NumberFormat can emit narrow no-break space (U+202F) or
// regular no-break space (U+00A0) as the thousands/currency separator.
// Normalise all of those to plain ASCII space before asserting on substrings.
function normalise(s: string): string {
  return s.replace(/[  ]/g, " ");
}

describe("formatMoney", () => {
  // ── India (INR) ─────────────────────────────────────────────────────────────

  it("formats whole rupees with no decimal places", () => {
    // 99900 paise = ₹999
    const result = normalise(formatMoney(99900, "in"));
    expect(result).toContain("₹");
    expect(result).toContain("999");
    expect(result).not.toContain(".");
  });

  it("formats rupees with paise when fraction present", () => {
    // 99950 paise = ₹999.50
    const result = normalise(formatMoney(99950, "in"));
    expect(result).toContain("₹");
    expect(result).toContain("999");
    expect(result).toContain("50");
  });

  it("formats zero rupees", () => {
    const result = normalise(formatMoney(0, "in"));
    expect(result).toContain("₹");
    expect(result).toContain("0");
  });

  it("formats large INR values without decimals", () => {
    // 199900 paise = ₹1999
    const result = normalise(formatMoney(199900, "in"));
    expect(result).toContain("₹");
    expect(result).toContain("1,999");
  });

  it("accepts a Region object instead of RegionId for INR", () => {
    const result = normalise(formatMoney(50000, REGIONS["in"]));
    expect(result).toContain("₹");
    expect(result).toContain("500");
  });

  // ── International (USD) ─────────────────────────────────────────────────────

  it("formats whole USD cents with two decimal places", () => {
    // 1499 cents = $14.99
    const result = normalise(formatMoney(1499, "intl"));
    expect(result).toContain("$");
    expect(result).toContain("14.99");
  });

  it("formats whole USD dollar amount with no cents (e.g. $15.00 shown without .00)", () => {
    // 1500 cents = $15.00 — no fraction, so no decimals
    const result = normalise(formatMoney(1500, "intl"));
    expect(result).toContain("$");
    expect(result).toContain("15");
    expect(result).not.toContain(".00");
  });

  it("formats zero USD", () => {
    const result = normalise(formatMoney(0, "intl"));
    expect(result).toContain("$");
    expect(result).toContain("0");
  });

  it("formats intl with Region object", () => {
    const result = normalise(formatMoney(2999, REGIONS["intl"]));
    expect(result).toContain("$");
    expect(result).toContain("29.99");
  });

  it("formats intl shipping fee ($9)", () => {
    // 900 cents = $9.00 — no fraction
    const result = normalise(formatMoney(900, "intl"));
    expect(result).toContain("$");
    expect(result).toContain("9");
    expect(result).not.toContain(".00");
  });
});

describe("percentOff", () => {
  it("returns 0 when no compareAt is provided", () => {
    expect(percentOff(99900)).toBe(0);
  });

  it("returns 0 when compareAt is undefined", () => {
    expect(percentOff(99900, undefined)).toBe(0);
  });

  it("returns 0 when compareAt equals price", () => {
    expect(percentOff(99900, 99900)).toBe(0);
  });

  it("returns 0 when compareAt is less than price", () => {
    expect(percentOff(99900, 50000)).toBe(0);
  });

  it("computes 50% off correctly", () => {
    // ₹999 down from ₹1999 → ~50%
    expect(percentOff(99900, 199900)).toBe(50);
  });

  it("computes percentage for a peeler", () => {
    // ₹299 down from ₹499 → 40%
    expect(percentOff(29900, 49900)).toBe(40);
  });

  it("computes percentage for USD prices", () => {
    // $14.99 down from $29.99 → 50%
    expect(percentOff(1499, 2999)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    // price=300, compareAt=700 → 57.14... → 57
    expect(percentOff(300, 700)).toBe(57);
  });

  it("returns 0 for compareAt = 0 (guard against divide-by-zero)", () => {
    expect(percentOff(100, 0)).toBe(0);
  });
});

describe("priceFor", () => {
  it("returns the price for a valid region", () => {
    const map = { in: 99900, intl: 1499 };
    expect(priceFor(map, "in")).toBe(99900);
    expect(priceFor(map, "intl")).toBe(1499);
  });

  it("returns 0 when the region key is missing from the map", () => {
    const map: Partial<Record<"in" | "intl", number>> = { in: 99900 };
    expect(priceFor(map, "intl")).toBe(0);
  });

  it("returns 0 for an empty map", () => {
    expect(priceFor({}, "in")).toBe(0);
    expect(priceFor({}, "intl")).toBe(0);
  });

  it("returns 0 when price is explicitly 0", () => {
    const map = { in: 0, intl: 0 };
    expect(priceFor(map, "in")).toBe(0);
  });
});
