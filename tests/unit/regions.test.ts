import { describe, it, expect } from "vitest";
import {
  isRegionId,
  getRegion,
  regionForCountry,
  REGIONS,
  DEFAULT_REGION,
  REGION_IDS,
} from "@/lib/regions";

describe("isRegionId", () => {
  it("returns true for 'in'", () => {
    expect(isRegionId("in")).toBe(true);
  });

  it("returns true for 'intl'", () => {
    expect(isRegionId("intl")).toBe(true);
  });

  it("returns false for an unknown string", () => {
    expect(isRegionId("us")).toBe(false);
    expect(isRegionId("eu")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isRegionId("")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isRegionId(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRegionId(null)).toBe(false);
  });

  it("is case-sensitive — 'IN' is not a valid RegionId", () => {
    expect(isRegionId("IN")).toBe(false);
    expect(isRegionId("INTL")).toBe(false);
  });
});

describe("getRegion", () => {
  it("returns the India region for 'in'", () => {
    const r = getRegion("in");
    expect(r.id).toBe("in");
    expect(r.currency).toBe("INR");
    expect(r.codAvailable).toBe(true);
    expect(r.freeShipThreshold).toBe(0);
  });

  it("returns the intl region for 'intl'", () => {
    const r = getRegion("intl");
    expect(r.id).toBe("intl");
    expect(r.currency).toBe("USD");
    expect(r.codAvailable).toBe(false);
    expect(r.freeShipThreshold).toBe(5000);
    expect(r.flatShipping).toBe(900);
  });

  it("falls back to the default region for an unknown string", () => {
    const r = getRegion("xx");
    expect(r.id).toBe(DEFAULT_REGION);
  });

  it("falls back to default for undefined", () => {
    const r = getRegion(undefined);
    expect(r.id).toBe(DEFAULT_REGION);
  });

  it("falls back to default for null", () => {
    const r = getRegion(null);
    expect(r.id).toBe(DEFAULT_REGION);
  });

  it("falls back to default for empty string", () => {
    const r = getRegion("");
    expect(r.id).toBe(DEFAULT_REGION);
  });

  it("default region is 'in'", () => {
    expect(DEFAULT_REGION).toBe("in");
  });
});

describe("regionForCountry", () => {
  it("maps 'IN' to 'in'", () => {
    expect(regionForCountry("IN")).toBe("in");
  });

  it("maps lowercase 'in' to 'in' (case-insensitive)", () => {
    expect(regionForCountry("in")).toBe("in");
  });

  it("maps 'US' to 'intl'", () => {
    expect(regionForCountry("US")).toBe("intl");
  });

  it("maps 'GB' to 'intl'", () => {
    expect(regionForCountry("GB")).toBe("intl");
  });

  it("maps 'AU' to 'intl'", () => {
    expect(regionForCountry("AU")).toBe("intl");
  });

  it("maps 'DE' to 'intl'", () => {
    expect(regionForCountry("DE")).toBe("intl");
  });

  it("maps null to the default region", () => {
    expect(regionForCountry(null)).toBe(DEFAULT_REGION);
  });

  it("maps undefined to the default region", () => {
    expect(regionForCountry(undefined)).toBe(DEFAULT_REGION);
  });

  it("maps empty string to the default region", () => {
    expect(regionForCountry("")).toBe(DEFAULT_REGION);
  });
});

describe("REGIONS constant", () => {
  it("has exactly the two expected region IDs", () => {
    expect(Object.keys(REGIONS)).toEqual(expect.arrayContaining(["in", "intl"]));
    expect(Object.keys(REGIONS)).toHaveLength(2);
  });

  it("India region has correct COD fee (₹50 in paise)", () => {
    expect(REGIONS["in"].codFee).toBe(5000);
  });

  it("INTL region has COD fee of 0", () => {
    expect(REGIONS["intl"].codFee).toBe(0);
  });

  it("REGION_IDS contains both IDs", () => {
    expect(REGION_IDS).toContain("in");
    expect(REGION_IDS).toContain("intl");
  });
});
