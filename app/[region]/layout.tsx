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
      <Header region={region} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer region={region} />
    </RegionProvider>
  );
}
