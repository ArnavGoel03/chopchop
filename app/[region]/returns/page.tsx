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
  LegalOl,
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
    title: "Returns & Refunds",
    description:
      region.id === "in"
        ? "7-day no-questions returns. We arrange free pickup. Refund in 48 hours."
        : "14-day returns for international orders. Refund within 5 business days.",
    path: `/${seg}/returns`,
    region: seg,
  });
}

export default async function ReturnsPage({
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
          Returns &amp; <em>Refunds.</em>
        </>
      }
      meta={
        isIN
          ? "7-day no-questions returns. We arrange pickup."
          : "14-day returns for international orders."
      }
    >
      <LegalCallout>
        {isIN
          ? "Don't love it? WhatsApp us within 7 days of delivery. We arrange free pickup and process your refund within 48 hours of receiving it back."
          : "Not what you expected? Email us within 14 days of delivery. Return shipping is at your cost unless the item is defective. Refund within 5 business days of receipt."}
      </LegalCallout>

      <LegalH2>How to start a return</LegalH2>
      {isIN ? (
        <LegalOl>
          <LegalLi>
            WhatsApp{" "}
            {wa ? (
              <a
                href={`https://wa.me/${wa.replace(/\D/g, "")}`}
                className="text-tomato underline"
              >
                {wa}
              </a>
            ) : (
              "us"
            )}{" "}
            with your order ID (e.g. CHOP-AB1234).
          </LegalLi>
          <LegalLi>
            Tell us why you&apos;re returning — one line is enough; we
            don&apos;t ask you to justify it.
          </LegalLi>
          <LegalLi>
            We arrange a courier pickup from your address within 48 hours.
          </LegalLi>
          <LegalLi>
            Pack the item in its original box if possible. Any sturdy box works
            if you&apos;ve already disposed of the original.
          </LegalLi>
        </LegalOl>
      ) : (
        <LegalOl>
          <LegalLi>
            Email{" "}
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-tomato underline">
              {BUSINESS_EMAIL}
            </a>{" "}
            with your order ID and the reason for return.
          </LegalLi>
          <LegalLi>
            We confirm within 1 business day and provide return shipping
            instructions.
          </LegalLi>
          <LegalLi>
            Ship the item back in its original packaging. Return shipping cost
            is your responsibility unless the item is defective or wrong.
          </LegalLi>
          <LegalLi>
            Once we receive and inspect the item, we issue the refund within 5
            business days.
          </LegalLi>
        </LegalOl>
      )}

      <LegalH2>Refund timeline</LegalH2>
      {isIN ? (
        <LegalUl>
          <LegalLi>
            <strong>UPI / Card / Net Banking:</strong> 48 hours after we
            receive the product, refunded to the same payment source.
          </LegalLi>
          <LegalLi>
            <strong>Wallet / EMI:</strong> 3–5 working days, depending on your
            bank or wallet provider.
          </LegalLi>
          <LegalLi>
            <strong>Cash on Delivery:</strong> Bank transfer or UPI to an
            account you confirm with us via WhatsApp. 48 hours after we receive
            the product.
          </LegalLi>
        </LegalUl>
      ) : (
        <LegalUl>
          <LegalLi>
            <strong>Card / digital wallet:</strong> 5 business days after we
            receive and inspect the return. Credited back to the original
            payment method.
          </LegalLi>
          <LegalLi>
            Actual credit appearance on your statement depends on your bank or
            card issuer — typically 2–5 additional business days.
          </LegalLi>
        </LegalUl>
      )}

      <LegalH2>What is not eligible for return</LegalH2>
      <LegalUl>
        <LegalLi>
          Items damaged by misuse — cracked body from drops, blades damaged by
          chopping ice, frozen food, or bones.
        </LegalLi>
        <LegalLi>
          Missing parts (bowl, lid, blade assembly, silicone base).
        </LegalLi>
        {isIN ? (
          <LegalLi>
            Returns requested after 7 days from the delivery date.
          </LegalLi>
        ) : (
          <LegalLi>
            Returns requested after 14 days from the delivery date.
          </LegalLi>
        )}
        <LegalLi>
          Hygiene-sealed accessories that have been opened and used.
        </LegalLi>
      </LegalUl>

      <LegalH2>Warranty claims (different from returns)</LegalH2>
      <LegalP>
        For manufacturing defects discovered after the return window — blade
        chipping, body cracks, mechanism failure — the 1-year warranty still
        applies. Send a photo of the defect{" "}
        {isIN
          ? "via WhatsApp"
          : `to ${BUSINESS_EMAIL}`}{" "}
        with your order ID. We replace the defective part or the whole unit at
        no charge.
      </LegalP>

      <LegalH2>Cancellations before dispatch</LegalH2>
      <LegalP>
        If your order hasn&apos;t shipped yet,{" "}
        {isIN ? "WhatsApp us" : "email us"} and we cancel it immediately with a
        full refund{isIN ? " within 24 hours" : " within 2 business days"}.
        After dispatch, treat it as a return following the process above.
      </LegalP>

      <LegalP className="text-xs text-ink-soft mt-10">
        © 2026 CHOP Goods Pvt. Ltd. — Bengaluru, Karnataka, India.
      </LegalP>
    </LegalShell>
  );
}
