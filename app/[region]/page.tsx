import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isRegionId, getRegion, REGION_IDS } from "@/lib/regions";
import { Hero } from "@/components/home/Hero";
import {
  FeaturedSection,
  CategorySection,
  HowItWorks,
  TrustBadges,
  ReviewsStrip,
  FinalCTA,
} from "@/components/home/sections";

export function generateStaticParams() {
  return REGION_IDS.map((region) => ({ region }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: seg } = await params;
  if (!isRegionId(seg)) return {};
  const region = getRegion(seg);

  const title =
    region.id === "in"
      ? "CHOP. — The 5-blade chopper made for Indian kitchens"
      : "CHOP. — Pull-cord kitchen choppers for every home";

  const description =
    region.id === "in"
      ? "Pull. Chop. Done. Prep pyaaz, tamatar and salad in ten seconds — no electricity. ₹999. Free delivery. COD across 25,000+ pincodes."
      : "Pull. Chop. Done. Manual 5-blade choppers that prep onions, herbs and salads in seconds. Worldwide shipping. No electricity needed.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: seg } = await params;
  if (!isRegionId(seg)) notFound();
  const region = getRegion(seg);

  return (
    <>
      <Hero region={region} />
      <TrustBadges region={region} />
      <FeaturedSection region={region} />
      <CategorySection region={region} />
      <HowItWorks region={region} />
      <ReviewsStrip region={region} />
      <FinalCTA region={region} />
    </>
  );
}
