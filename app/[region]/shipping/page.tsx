import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isRegionId, getRegion, REGION_IDS } from "@/lib/regions";
import { buildMetadata, BUSINESS_EMAIL } from "@/lib/seo";
import {
  LegalShell,
  LegalH2,
  LegalP,
  LegalUl,
  LegalLi,
  LegalCallout,
} from "@/components/seo/LegalShell";

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
  return buildMetadata({
    title: "Shipping & Delivery",
    description:
      region.id === "in"
        ? "Free shipping across India. 3–7 working days. COD across 25,000+ pincodes."
        : "Worldwide shipping in 7–14 business days. Tracked and insured. Free over $50.",
    path: `/${seg}/shipping`,
    region: seg,
  });
}

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: seg } = await params;
  if (!isRegionId(seg)) notFound();
  const region = getRegion(seg);
  const isIN = region.id === "in";
  const wa = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;

  return (
    <LegalShell
      eyebrow="Policy"
      title={
        <>
          Shipping &amp; <em>Delivery.</em>
        </>
      }
      meta={
        isIN
          ? "Free across India. 3–7 working days. COD across 25,000+ pincodes."
          : "Worldwide. 7–14 business days. Tracked and insured."
      }
    >
      {isIN ? (
        <>
          <LegalCallout>
            Every order ships free, regardless of size. We dispatch the same
            day if you order before 6 PM IST on a working day.
          </LegalCallout>

          <LegalH2>Delivery estimates by region</LegalH2>
          <LegalUl>
            <LegalLi>
              <strong>Metro cities</strong> (Mumbai, Delhi NCR, Bengaluru,
              Hyderabad, Chennai, Kolkata, Pune, Ahmedabad) — 3–5 working days
            </LegalLi>
            <LegalLi>
              <strong>Tier 2 cities</strong> — 5–6 working days
            </LegalLi>
            <LegalLi>
              <strong>Tier 3 / rural / Northeast / Andamans</strong> — 6–9
              working days
            </LegalLi>
          </LegalUl>

          <LegalH2>Dispatch timeline</LegalH2>
          <LegalP>
            Orders placed before 6 PM IST on a working day dispatch the same
            day. Orders after 6 PM, on Sundays, or on national public holidays
            dispatch the next working day.
          </LegalP>

          <LegalH2>Couriers we use</LegalH2>
          <LegalUl>
            <LegalLi>
              <strong>Delhivery</strong> — primary carrier for metro and Tier 2
              pincodes
            </LegalLi>
            <LegalLi>
              <strong>Bluedart</strong> — for time-sensitive Tier 2 / Tier 3
              shipments
            </LegalLi>
            <LegalLi>
              <strong>Ekart</strong> — for Flipkart-network pincodes
            </LegalLi>
            <LegalLi>
              <strong>India Post</strong> — for last-mile rural pincodes where
              private couriers don&apos;t reach
            </LegalLi>
          </LegalUl>

          <LegalH2>Tracking</LegalH2>
          <LegalP>
            You receive a tracking ID via SMS and WhatsApp within 2 hours of
            dispatch. Check live status on our{" "}
            <a href={`/${seg}/track`} className="text-tomato underline">
              order tracking page
            </a>{" "}
            using your CHOP-XXXXXXXX order ID.
          </LegalP>

          <LegalH2>Cash on Delivery (COD)</LegalH2>
          <LegalUl>
            <LegalLi>Available across 25,000+ pincodes.</LegalLi>
            <LegalLi>₹50 handling fee shown clearly at checkout.</LegalLi>
            <LegalLi>
              Pay the courier in cash or by UPI on the day of delivery.
            </LegalLi>
            <LegalLi>
              Our team confirms every COD order by WhatsApp before dispatch.
            </LegalLi>
          </LegalUl>

          <LegalH2>Address changes</LegalH2>
          <LegalP>
            You can change your delivery address only before dispatch. WhatsApp
            us within 6 hours of placing your order. After dispatch, addresses
            are locked with the courier.
          </LegalP>

          <LegalH2>Failed delivery attempts</LegalH2>
          <LegalP>
            Couriers attempt delivery up to 3 times. If all attempts fail, the
            package returns to us. We&apos;ll WhatsApp you to confirm a new
            address — re-shipping is free.
          </LegalP>

          <LegalH2>Damaged on arrival</LegalH2>
          <LegalP>
            If the outer box looks tampered or crushed when the courier arrives,
            refuse the delivery and{" "}
            {wa ? (
              <>
                WhatsApp us at{" "}
                <a
                  href={`https://wa.me/${wa.replace(/\D/g, "")}`}
                  className="text-tomato underline"
                >
                  {wa}
                </a>{" "}
              </>
            ) : (
              "contact us "
            )}
            with a photo. We dispatch a replacement immediately at no cost.
          </LegalP>
        </>
      ) : (
        <>
          <LegalCallout>
            We ship from Bengaluru, India to most countries worldwide. All
            international orders are tracked and insured from dispatch to
            delivery.
          </LegalCallout>

          <LegalH2>Shipping rates</LegalH2>
          <LegalUl>
            <LegalLi>
              Orders under $50 — $9 flat shipping fee, shown at checkout.
            </LegalLi>
            <LegalLi>
              Orders $50 and above — free international shipping.
            </LegalLi>
          </LegalUl>

          <LegalH2>Delivery estimates</LegalH2>
          <LegalUl>
            <LegalLi>
              <strong>USA, Canada, UK, EU, Australia</strong> — 7–10 business
              days
            </LegalLi>
            <LegalLi>
              <strong>Southeast Asia, Middle East</strong> — 7–12 business days
            </LegalLi>
            <LegalLi>
              <strong>Rest of world</strong> — 10–14 business days
            </LegalLi>
          </LegalUl>
          <LegalP>
            These are estimates from dispatch, not order date. Allow 1 working
            day for order processing before dispatch.
          </LegalP>

          <LegalH2>Tracking</LegalH2>
          <LegalP>
            A tracking number is emailed to you within 24 hours of dispatch.
            Track your shipment on our{" "}
            <a href={`/${seg}/track`} className="text-tomato underline">
              order tracking page
            </a>{" "}
            or directly on the courier&apos;s website.
          </LegalP>

          <LegalH2>Customs, duties &amp; VAT</LegalH2>
          <LegalP>
            Your country&apos;s customs authority may levy import duties, VAT,
            or a customs clearance fee on delivery. These charges are not
            included in our prices and are your responsibility to pay. We
            cannot predict the exact amount — check with your local customs
            office for your country&apos;s import thresholds.
          </LegalP>
          <LegalP>
            All shipments include accurate commercial invoices. We do not
            under-declare values or mark shipments as &ldquo;gift&rdquo; to
            avoid duties.
          </LegalP>

          <LegalH2>Damaged or lost shipments</LegalH2>
          <LegalP>
            All international orders are insured. If your package arrives
            damaged or does not arrive within 20 business days of dispatch,
            email us at{" "}
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-tomato underline">
              {BUSINESS_EMAIL}
            </a>{" "}
            with your order ID and a photo (if damaged). We resolve it within 3
            business days.
          </LegalP>

          <LegalH2>Address changes</LegalH2>
          <LegalP>
            International address changes are possible only before the order is
            handed to the courier. Email us within 12 hours of placing your
            order.
          </LegalP>
        </>
      )}

      <LegalP className="text-xs text-ink-soft mt-10">
        © 2026 CHOP Goods Pvt. Ltd. — Bengaluru, Karnataka, India.
      </LegalP>
    </LegalShell>
  );
}
