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
    title: "Terms of Service",
    description:
      "CHOP. terms of service — pricing, orders, payments, shipping, returns, and warranty.",
    path: `/${seg}/terms`,
    region: seg,
  });
}

export default async function TermsPage({
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
          Terms of <em>Service.</em>
        </>
      }
      meta="Effective 17 May 2026 · By placing an order, you accept these terms."
    >
      <LegalCallout>
        We are a real company shipping real products from Bengaluru, India.
        These terms spell out exactly what you can expect from us and what we
        expect from you.
      </LegalCallout>

      <LegalH2>1. Who we are</LegalH2>
      <LegalP>
        CHOP. is a brand of CHOP Goods Pvt. Ltd., registered in Bengaluru,
        Karnataka, India. References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, and
        &ldquo;our&rdquo; mean CHOP Goods Pvt. Ltd.
      </LegalP>

      <LegalH2>2. Pricing &amp; taxes</LegalH2>
      {isIN ? (
        <LegalP>
          All prices are in Indian Rupees (INR / ₹) and include GST. The price
          shown at checkout is what you pay. The only additional charge is the
          ₹50 COD handling fee, which is shown clearly before you confirm.
        </LegalP>
      ) : (
        <LegalP>
          All prices are in US Dollars (USD / $). The price shown at checkout
          does not include import duties, customs fees, or local VAT in your
          country — these are levied by your customs authority on arrival and
          are your responsibility to pay. We clearly note this before you
          confirm your order.
        </LegalP>
      )}

      <LegalH2>3. Orders</LegalH2>
      <LegalP>
        An order is confirmed when:
      </LegalP>
      <LegalUl>
        {isIN ? (
          <>
            <LegalLi>
              <strong>Prepaid:</strong> Razorpay confirms successful payment and
              we send you a WhatsApp/SMS confirmation.
            </LegalLi>
            <LegalLi>
              <strong>COD:</strong> Our team confirms your order by WhatsApp
              before dispatch.
            </LegalLi>
          </>
        ) : (
          <LegalLi>
            <strong>Online payment:</strong> Stripe confirms successful payment
            and we send you an email confirmation.
          </LegalLi>
        )}
      </LegalUl>
      <LegalP>
        We reserve the right to cancel an order if the product goes out of
        stock or we suspect fraud. Cancelled orders are refunded in full within
        5 working days.
      </LegalP>

      <LegalH2>4. Payment</LegalH2>
      {isIN ? (
        <LegalP>
          We accept UPI, debit/credit cards, net banking, wallets, and EMI via
          Razorpay. Cash on Delivery (COD) is available across 25,000+
          pincodes for a ₹50 handling fee.
        </LegalP>
      ) : (
        <LegalP>
          We accept major debit and credit cards, Apple Pay, Google Pay, and
          local payment methods via Stripe. We do not offer COD for
          international orders.
        </LegalP>
      )}

      <LegalH2>5. Shipping</LegalH2>
      {isIN ? (
        <LegalP>
          Free shipping across India. Estimated delivery 3–7 working days
          depending on pincode. Full details on our{" "}
          <a href={`/${seg}/shipping`} className="text-tomato underline">
            Shipping page
          </a>
          .
        </LegalP>
      ) : (
        <LegalP>
          We ship worldwide. Flat shipping fee applies; orders above $50 ship
          free. Estimated delivery 7–14 business days, tracked and insured.
          Import duties and VAT at destination are not included. Full details
          on our{" "}
          <a href={`/${seg}/shipping`} className="text-tomato underline">
            Shipping page
          </a>
          .
        </LegalP>
      )}

      <LegalH2>6. Returns &amp; refunds</LegalH2>
      {isIN ? (
        <LegalP>
          7-day no-questions returns from the delivery date. Full policy on our{" "}
          <a href={`/${seg}/returns`} className="text-tomato underline">
            Returns page
          </a>
          .
        </LegalP>
      ) : (
        <LegalP>
          14-day returns from the delivery date for unused, undamaged items.
          Return shipping is at the buyer&apos;s cost unless the item is
          defective. Full policy on our{" "}
          <a href={`/${seg}/returns`} className="text-tomato underline">
            Returns page
          </a>
          .
        </LegalP>
      )}

      <LegalH2>7. Warranty</LegalH2>
      <LegalP>
        CHOP. products carry a 1-year manufacturing-defect warranty covering
        blade chipping, body cracks, and mechanism failure. Damage from misuse
        — chopping ice, frozen food, hard nuts, or bones — is not covered and
        voids the warranty. To claim, send a photo of the defect via{" "}
        {isIN ? "WhatsApp" : "email"} with your order ID.
      </LegalP>

      <LegalH2>8. Safe use</LegalH2>
      <LegalP>
        CHOP. choppers are manual hand-operated tools. Keep fingers away from
        the blade assembly during operation. Do not chop ice, frozen food, hard
        nuts, or bones — doing so can damage the blades and will void the
        warranty.
      </LegalP>

      <LegalH2>9. Intellectual property</LegalH2>
      <LegalP>
        All site content — including the logo, copy, illustrations, and
        photography — is the property of CHOP Goods Pvt. Ltd. Do not reproduce
        any content without written permission.
      </LegalP>

      <LegalH2>10. Limitation of liability</LegalH2>
      <LegalP>
        Our liability for any claim is limited to the amount you paid for the
        product. We are not responsible for indirect or consequential damages.
      </LegalP>

      <LegalH2>11. Jurisdiction</LegalH2>
      {isIN ? (
        <LegalP>
          These terms are governed by Indian law. Any dispute is subject to the
          exclusive jurisdiction of courts in Bengaluru, Karnataka.
        </LegalP>
      ) : (
        <LegalP>
          These terms are governed by Indian law. We will attempt to resolve
          any dispute amicably; if that fails, the matter is subject to
          arbitration under the rules applicable in Bengaluru, Karnataka,
          India.
        </LegalP>
      )}

      <LegalH2>12. Contact</LegalH2>
      <LegalP>
        Email{" "}
        <a href={`mailto:${BUSINESS_EMAIL}`} className="text-tomato underline">
          {BUSINESS_EMAIL}
        </a>
        {isIN && wa && (
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
