import { describe, it, expect } from "vitest";
import { cn, generateOrderCode, slugify } from "@/lib/utils";

// Deterministic rand sequence from a seed array
function makeRand(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("generateOrderCode", () => {
  it("produces the format CHOP-XXXXX-NNNN", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^CHOP-[A-Z0-9]{5}-\d{4}$/);
  });

  it("is deterministic when given a fixed rand sequence", () => {
    // With two fixed values the output should be identical on two calls
    const rand = makeRand([0.5, 0.5]);
    const a = generateOrderCode(rand);
    const rand2 = makeRand([0.5, 0.5]);
    const b = generateOrderCode(rand2);
    expect(a).toBe(b);
  });

  it("numeric suffix is between 1000 and 9999", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOrderCode();
      const num = parseInt(code.split("-")[2], 10);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  it("alpha part is exactly 5 uppercase alphanumeric chars", () => {
    const code = generateOrderCode();
    const alpha = code.split("-")[1];
    expect(alpha).toHaveLength(5);
    expect(alpha).toMatch(/^[A-Z0-9]+$/);
  });

  it("always starts with CHOP-", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateOrderCode()).toMatch(/^CHOP-/);
    }
  });

  it("uses the injected rand — different sequences produce different codes", () => {
    const codeA = generateOrderCode(makeRand([0.1, 0.2]));
    const codeB = generateOrderCode(makeRand([0.9, 0.8]));
    expect(codeA).not.toBe(codeB);
  });

  it("alpha part is zero-padded to 5 chars when rand produces small value", () => {
    // rand() = 0 → floor(0 * 36^5) = 0 → "00000"
    const code = generateOrderCode(makeRand([0, 0.1]));
    expect(code.split("-")[1]).toBe("00000");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("collapses multiple special chars into one hyphen", () => {
    expect(slugify("hello   world!!!")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("CHOP. 5-Blade Chopper")).toBe("chop-5-blade-chopper");
  });

  it("handles already-slugified strings", () => {
    expect(slugify("5-blade-chopper")).toBe("5-blade-chopper");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles only special chars → empty string", () => {
    expect(slugify("!!!---???")).toBe("");
  });

  it("handles unicode letters by stripping them (only a-z0-9 pass)", () => {
    // Non-ascii gets stripped since [^a-z0-9]+ replaces to hyphen
    const r = slugify("café");
    // "caf" stays, "é" becomes "-", trimmed → "caf"
    expect(r).toMatch(/^[a-z0-9-]+$/);
  });

  it("handles numbers", () => {
    expect(slugify("Product 123")).toBe("product-123");
  });
});

describe("cn (class name utility)", () => {
  it("merges classes correctly", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles conditional classes with undefined", () => {
    expect(cn("base", undefined, "extra")).toBe("base extra");
  });

  it("handles conditional classes with false", () => {
    expect(cn("base", false && "extra")).toBe("base");
  });

  it("deduplicates Tailwind conflicting classes", () => {
    // tailwind-merge should prefer last
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conditional array", () => {
    const result = cn("a", { b: true, c: false });
    expect(result).toBe("a b");
  });

  it("handles empty arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles only falsy values", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});
