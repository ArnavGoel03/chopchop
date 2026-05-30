import { notFound } from "next/navigation";
import { isRegionId, REGIONS, REGION_IDS } from "@/lib/regions";
import { RegionProvider } from "@/lib/region-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export function generateStaticParams() {
  return REGION_IDS.map((region) => ({ region }));
}

export default async function RegionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
}) {
  const { region: seg } = await params;
  if (!isRegionId(seg)) notFound();
  const region = REGIONS[seg];

  return (
    <RegionProvider region={region}>
      {/* Skip-to-content: visually hidden until focused (A07) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper focus:outline-none focus:ring-2 focus:ring-tomato"
      >
        Skip to content
      </a>
      <Header region={region} />
      <main id="main-content" className="min-h-[60vh]">{children}</main>
      <Footer region={region} />
    </RegionProvider>
  );
}
