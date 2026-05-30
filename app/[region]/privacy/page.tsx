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
  return buildMetadata({
    title: "Privacy Policy",
    description:
      "How CHOP. collects, stores, and protects your personal data. We never sell your information.",
    path: `/${seg}/privacy`,
    region: seg,
    noindex: false,
  });
}

export default async function PrivacyPage({
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
      eyebrow="Legal"
      title={
        <>
          Privacy <em>Policy.</em>
        </>
      }
      meta="Effective 17 May 2026 · Last updated 17 May 2026"
    >
      <LegalCallout>
        The short version: we collect only what we need to send you the right
        product to the right address. We do not sell your data.
      </LegalCallout>

      <LegalH2>What we collect</LegalH2>
      <LegalP>When you place an order or use this site, we collect:</LegalP>
      <LegalUl>
        <LegalLi>
          <strong>Identity &amp; contact</strong> — your name, phone number,
          delivery address{isIN ? ", optional email and GSTIN" : " and email"}.
        </LegalLi>
        <LegalLi>
          <strong>Payment</strong> — handled by{" "}
          {isIN ? "Razorpay (PCI-DSS Level 1 certified)" : "Stripe (PCI-DSS Level 1 certified)"}
          . We never see or store your card{isIN ? ", UPI," : ""} or banking
          credentials.
        </LegalLi>
        <LegalLi>
          <strong>Order data</strong> — what you bought, when, and any discount
          codes used.
        </LegalLi>
        <LegalLi>
          <strong>Technical</strong> — IP address, browser, device type,
          referring page. Used for fraud prevention and analytics only.
        </LegalLi>
        <LegalLi>
          <strong>Marketing signals</strong> — via Meta Pixel if you arrived
          from a Facebook or Instagram ad, so we can measure ad performance. You
          can opt out by disabling cookies in your browser.
        </LegalLi>
      </LegalUl>

      <LegalH2>Why we collect it</LegalH2>
      <LegalUl>
        {isIN ? (
          <>
            <LegalLi>
              To fulfil your order — courier handover, COD verification, GST
              invoice.
            </LegalLi>
            <LegalLi>To send order updates via SMS and WhatsApp.</LegalLi>
            <LegalLi>To process returns and warranty claims.</LegalLi>
            <LegalLi>
              To comply with Indian tax law — records retained for 7 years as
              required by GST rules.
            </LegalLi>
            <LegalLi>
              To improve our products, ads, and site performance.
            </LegalLi>
          </>
        ) : (
          <>
            <LegalLi>
              To fulfil your order — international courier handover, customs
              documentation, tracking.
            </LegalLi>
            <LegalLi>
              To send order confirmation and dispatch updates by email.
            </LegalLi>
            <LegalLi>To process returns and warranty claims.</LegalLi>
            <LegalLi>
              To comply with applicable tax and export laws — records retained
              for the legally required period.
            </LegalLi>
            <LegalLi>
              To improve our products, ads, and site performance.
            </LegalLi>
          </>
        )}
      </LegalUl>

      <LegalH2>Who we share it with</LegalH2>
      <LegalUl>
        {isIN ? (
          <>
            <LegalLi>
              <strong>Couriers</strong> — Delhivery, Bluedart, Ekart, India
              Post for delivery purposes only.
            </LegalLi>
            <LegalLi>
              <strong>Payment processor</strong> — Razorpay for online payment
              processing.
            </LegalLi>
            <LegalLi>
              <strong>SMS / WhatsApp providers</strong> — for order status
              updates.
            </LegalLi>
            <LegalLi>
              <strong>Tax authorities</strong> — as required under Indian GST
              and income tax law.
            </LegalLi>
          </>
        ) : (
          <>
            <LegalLi>
              <strong>International couriers</strong> — DHL, FedEx, or partner
              logistics for cross-border delivery.
            </LegalLi>
            <LegalLi>
              <strong>Payment processor</strong> — Stripe for secure payment
              processing.
            </LegalLi>
            <LegalLi>
              <strong>Email service</strong> — for transactional order updates.
            </LegalLi>
            <LegalLi>
              <strong>Customs authorities</strong> — shipment manifests shared
              as required by import regulations in your country.
            </LegalLi>
          </>
        )}
        <LegalLi>
          <strong>Meta / Google</strong> — anonymised event signals (page view,
          purchase) for ad optimisation. You can opt out by disabling cookies.
        </LegalLi>
      </LegalUl>
      <LegalP>
        <strong>We do not sell your data. Ever.</strong>
      </LegalP>

      <LegalH2>How we store it</LegalH2>
      <LegalP>
        {isIN
          ? "Order records live on servers hosted in India. Payment data lives only with Razorpay — never on our infrastructure. Backups are encrypted."
          : "Order records live on servers hosted in India. Payment data lives only with Stripe — never on our infrastructure. International shipment data is shared only with the courier handling your delivery."}
      </LegalP>

      <LegalH2>Your rights</LegalH2>
      <LegalUl>
        <LegalLi>Request a copy of all data we hold on you.</LegalLi>
        <LegalLi>Request corrections to inaccurate data.</LegalLi>
        <LegalLi>
          Request deletion — note that we cannot delete GST invoices
          {isIN ? " for 7 years as required by Indian law" : " or customs records during the legally required retention period"}.
        </LegalLi>
        {isIN ? (
          <LegalLi>
            Opt out of marketing SMS / WhatsApp at any time by replying STOP.
          </LegalLi>
        ) : (
          <LegalLi>
            Opt out of marketing emails at any time via the unsubscribe link.
          </LegalLi>
        )}
        {!isIN && (
          <LegalLi>
            If you are in the EU or UK, you may also lodge a complaint with your
            local data protection authority.
          </LegalLi>
        )}
      </LegalUl>

      <LegalH2>Cookies</LegalH2>
      <LegalP>
        We use cookies for session continuity, fraud prevention, and (if
        enabled) Meta Pixel ad measurement. You can clear cookies in your
        browser settings; the site will still work but ad attribution will be
        lost.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        For any privacy question, email{" "}
        <a href={`mailto:${BUSINESS_EMAIL}`} className="text-tomato underline">
          {BUSINESS_EMAIL}
        </a>
        {wa && (
          <>
            {" "}
            or WhatsApp{" "}
            <a
              href={`https://wa.me/${wa.replace(/\D/g, "")}`}
              className="text-tomato underline"
            >
              {wa}
            </a>
          </>
        )}
        .
      </LegalP>

      <LegalP className="text-xs text-ink-soft mt-10">
        © 2026 CHOP Goods Pvt. Ltd. — Bengaluru, Karnataka, India.
      </LegalP>
    </LegalShell>
  );
}
