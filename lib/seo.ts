import type { Metadata } from "next";
import type { RegionId } from "./types";
import { REGION_IDS } from "./regions";

// ── Site constants ────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://chop.example.com";

export const SITE_NAME = "CHOP.";
export const SITE_TAGLINE = "Kitchen tools made for the way you cook";
export const BUSINESS_NAME = "CHOP Goods Pvt. Ltd.";
export const BUSINESS_EMAIL = "hello@chop.shop";
export const BUSINESS_CITY = "Bengaluru";
export const BUSINESS_COUNTRY = "IN";

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Build an absolute URL from a path (no double slashes). */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** The canonical path counterpart in the other region. */
function mirrorPath(path: string, fromRegion: RegionId): string {
  const other: RegionId = fromRegion === "in" ? "intl" : "in";
  // e.g. /in/shop  ->  /intl/shop
  const withoutRegion = path.replace(new RegExp(`^/${fromRegion}(/|$)`), "/");
  return `/${other}${withoutRegion === "/" ? "" : withoutRegion}`;
}

// ── Core metadata builder ─────────────────────────────────────────────────────

export interface BuildMetadataOptions {
  title: string;
  description: string;
  /** Relative path, e.g. "/in/shop". Include the leading slash. */
  path: string;
  region?: RegionId;
  /** Absolute OG image URLs. */
  images?: string[];
  noindex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  region,
  images,
  noindex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  const ogImages = images?.length
    ? images.map((url) => ({ url }))
    : [{ url: absoluteUrl("/og-default.jpg") }];

  // Build hreflang alternates: one per region + x-default points to /in
  const alternates: Metadata["alternates"] = {
    canonical,
    languages: {} as Record<string, string>,
  };

  if (region) {
    const other: RegionId = region === "in" ? "intl" : "in";
    const mirrorAbs = absoluteUrl(mirrorPath(path, region));
    (alternates.languages as Record<string, string>)[
      region === "in" ? "en-IN" : "en"
    ] = canonical;
    (alternates.languages as Record<string, string>)[
      other === "in" ? "en-IN" : "en"
    ] = mirrorAbs;
    // x-default always points to the /in variant (home region).
    // If we're already on /in, canonical IS the /in path; otherwise mirrorAbs is /in.
    (alternates.languages as Record<string, string>)["x-default"] =
      region === "in" ? canonical : mirrorAbs;
  } else {
    // Non-region page: emit both regions as alternates
    for (const rid of REGION_IDS) {
      (alternates.languages as Record<string, string>)[
        rid === "in" ? "en-IN" : "en"
      ] = absoluteUrl(`/${rid}${path.replace(/^\//, "") ? `/${path.replace(/^\//, "")}` : ""}`);
    }
    (alternates.languages as Record<string, string>)["x-default"] =
      absoluteUrl(`/in`);
  }

  return {
    title,
    description,
    alternates,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}
