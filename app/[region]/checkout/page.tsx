"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { AlertTriangle, MessageCircle, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { resolveLines, computeTotals } from "@/lib/cart/totals";
import { getRegion, isRegionId } from "@/lib/regions";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentMethodTabs } from "@/components/checkout/PaymentMethodTabs";
import type { PaymentMethod } from "@/lib/types";
import {
  buildCheckoutPayload,
  callCheckout,
  callVerify,
  loadRazorpay,
  runRazorpay,
  loadStripe,
  runStripe,
} from "@/lib/checkout-client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const WA_NUMBER =
  process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "919999999999";

function whatsappUrl(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function isValidInPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

function isValidIntlPhone(phone: string) {
  // Accept E.164-ish: optional +, 7–15 digits
  return /^\+?\d{7,15}$/.test(phone.trim().replace(/[\s\-().]/g, ""));
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidGstin(gstin: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    gstin.trim().toUpperCase(),
  );
}

// ─── Small reusable field ─────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-tomato" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[12px] text-tomato" role="alert">
          <AlertTriangle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[14px] placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-tomato transition";

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean },
) {
  const { hasError, className, ...rest } = props;
  return (
    <input
      className={cn(inputBase, hasError && "border-tomato", className)}
      {...rest}
    />
  );
}

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    hasError?: boolean;
  },
) {
  const { hasError, className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-3 text-[14px] placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-tomato transition",
        hasError && "border-tomato",
        className,
      )}
      {...rest}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ coupon?: string }>;
}) {
  const { region: seg } = use(params);
  const { coupon: couponParam } = use(searchParams);

  if (!isRegionId(seg)) notFound();
  const regionSeg = seg as import("@/lib/types").RegionId;

  const region = getRegion(regionSeg);
  const router = useRouter();
  const { lines, clear } = useCart();

  const couponCode = (couponParam ?? "").trim().toUpperCase();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [gstToggle, setGstToggle] = useState(false);
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile toggle

  // ── Submission state ────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayUnavailable, setGatewayUnavailable] = useState(false);

  // ── Validation errors ────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Cart math ───────────────────────────────────────────────────────────────
  const resolved = resolveLines(lines, regionSeg);
  const totals = computeTotals(resolved, regionSeg, { method, couponCode });

  // Preload payment gateway script
  useEffect(() => {
    if (region.paymentProvider === "razorpay") {
      loadRazorpay().then((ok) => !ok && setGatewayUnavailable(true));
    } else {
      loadStripe().then((ok) => !ok && setGatewayUnavailable(true));
    }
  }, [region.paymentProvider]);

  // If cart is empty, send back
  useEffect(() => {
    if (lines.length === 0) {
      router.replace(`/${seg}/cart`);
    }
  }, [lines.length, seg, router]);

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!phone.trim()) {
      e.phone = "Phone number is required";
    } else if (
      seg === "in" && !isValidInPhone(phone)
    ) {
      e.phone = "Enter a valid 10-digit Indian mobile number";
    } else if (
      seg === "intl" && !isValidIntlPhone(phone)
    ) {
      e.phone = "Enter a valid international phone number";
    }
    if (seg === "intl") {
      if (!email.trim()) {
        e.email = "Email is required for international orders";
      } else if (!isValidEmail(email)) {
        e.email = "Enter a valid email address";
      }
    } else if (email.trim() && !isValidEmail(email)) {
      e.email = "Enter a valid email address";
    }
    if (!address.trim()) e.address = "Shipping address is required";
    if (gstToggle && seg === "in") {
      if (!gstin.trim()) {
        e.gstin = "GSTIN is required for GST invoice";
      } else if (!isValidGstin(gstin)) {
        e.gstin = "Enter a valid 15-character GSTIN";
      }
      if (!businessName.trim()) e.businessName = "Business name is required";
    }
    return e;
  }, [name, phone, email, address, seg, gstToggle, gstin, businessName]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setError(null);
    setSubmitting(true);

    try {
      const customer = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      };

      const payload = buildCheckoutPayload(
        regionSeg,
        resolved,
        totals,
        customer,
        method,
        {
          couponCode: couponCode || undefined,
          shippingAddress: address.trim(),
          gstin: gstToggle && seg === "in" ? gstin.trim().toUpperCase() : undefined,
          businessName: gstToggle && seg === "in" ? businessName.trim() : undefined,
        },
      );

      const checkoutRes = await callCheckout(payload);

      if (!checkoutRes.ok) {
        const msg = "error" in checkoutRes ? checkoutRes.error : undefined;
        setError(msg ?? "Could not create your order. Please try again.");
        setSubmitting(false);
        return;
      }

      const { orderCode } = checkoutRes;

      // ── COD path ────────────────────────────────────────────────────────────
      if (method === "cod") {
        clear();
        router.push(`/${seg}/order/${orderCode}`);
        return;
      }

      // ── Online payment ──────────────────────────────────────────────────────
      if (!("providerOrderId" in checkoutRes)) {
        setError("Invalid payment session. Please try again.");
        setSubmitting(false);
        return;
      }

      if (region.paymentProvider === "razorpay") {
        if (!checkoutRes.keyId) {
          setError("Payment configuration missing. Please order via WhatsApp.");
          setGatewayUnavailable(true);
          setSubmitting(false);
          return;
        }
        try {
          const rpReady = await loadRazorpay();
          if (!rpReady) {
            setGatewayUnavailable(true);
            setError(null);
            setSubmitting(false);
            return;
          }
          const handlerRes = await runRazorpay({
            keyId: checkoutRes.keyId,
            providerOrderId: checkoutRes.providerOrderId,
            amount: checkoutRes.amount,
            currency: checkoutRes.currency,
            orderCode,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
          });
          const verifyRes = await callVerify({ orderCode, ...handlerRes });
          if (!verifyRes.ok) {
            setError(
              verifyRes.error ??
                "Payment verification failed. Contact support if amount was deducted.",
            );
            setSubmitting(false);
            return;
          }
          clear();
          router.push(`/${seg}/order/${orderCode}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "Payment cancelled") {
            setError(null);
          } else {
            setError(msg);
          }
          setSubmitting(false);
        }
      } else {
        // Stripe
        if (!checkoutRes.clientSecret) {
          setError("Payment configuration missing. Please order via WhatsApp.");
          setGatewayUnavailable(true);
          setSubmitting(false);
          return;
        }
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
          setGatewayUnavailable(true);
          setSubmitting(false);
          return;
        }
        try {
          const stripeReady = await loadStripe();
          if (!stripeReady) {
            setGatewayUnavailable(true);
            setSubmitting(false);
            return;
          }
          // confirmPayment redirects on success; we set returnUrl to confirmation page
          const returnUrl = `${window.location.origin}/${seg}/order/${orderCode}`;
          await runStripe({
            publishableKey: stripeKey,
            clientSecret: checkoutRes.clientSecret,
            customerEmail: customer.email,
            returnUrl,
          });
          // If we reach here, stripe redirected (no-op) OR threw an error
          clear();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setSubmitting(false);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Empty cart guard (render) ────────────────────────────────────────────────
  if (resolved.length === 0) {
    return (
      <Container className="py-24 text-center">
        <p className="text-ink-soft">Your cart is empty.</p>
        <ButtonLink href={`/${seg}/shop`} variant="primary" className="mt-6 inline-flex">
          Shop now
        </ButtonLink>
      </Container>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display mb-8 text-3xl font-bold md:text-4xl">
        Checkout
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handlePlaceOrder} noValidate className="space-y-8">

          {/* Contact details */}
          <section aria-labelledby="contact-heading" className="space-y-4">
            <h2 id="contact-heading" className="font-display text-lg font-bold">
              Contact details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <Input
                  id="field-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  hasError={!!errors.name}
                  aria-required="true"
                  aria-describedby={errors.name ? "field-name-error" : undefined}
                />
              </Field>

              <Field
                label={seg === "in" ? "Mobile number" : "Phone number"}
                error={errors.phone}
                required
              >
                <Input
                  id="field-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={seg === "in" ? "9876543210" : "+1 555 000 1234"}
                  hasError={!!errors.phone}
                  aria-required="true"
                />
              </Field>
            </div>

            <Field
              label={seg === "intl" ? "Email address" : "Email address (optional)"}
              error={errors.email}
              required={seg === "intl"}
            >
              <Input
                id="field-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                hasError={!!errors.email}
                aria-required={seg === "intl" ? "true" : "false"}
              />
            </Field>
          </section>

          {/* Shipping address */}
          <section aria-labelledby="address-heading" className="space-y-4">
            <h2 id="address-heading" className="font-display text-lg font-bold">
              Shipping address
            </h2>
            <Field label="Full address" error={errors.address} required>
              <Textarea
                id="field-address"
                autoComplete="street-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  seg === "in"
                    ? "Flat / House, Street, Area, City, State, PIN"
                    : "Street, City, State / Province, Postal code, Country"
                }
                hasError={!!errors.address}
                aria-required="true"
              />
            </Field>
            <p className="text-[12px] text-ink-soft">{region.shippingCopy}</p>
          </section>

          {/* GST Invoice (India only) */}
          {seg === "in" && (
            <section className="space-y-4">
              <button
                type="button"
                onClick={() => setGstToggle((v) => !v)}
                className="flex items-center gap-2 text-[14px] font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                {gstToggle ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                I need a GST invoice (optional)
              </button>

              {gstToggle && (
                <div className="grid gap-4 rounded-xl border border-line bg-paper-2 p-4 sm:grid-cols-2">
                  <Field label="GSTIN" error={errors.gstin} required>
                    <Input
                      id="field-gstin"
                      type="text"
                      value={gstin}
                      onChange={(e) =>
                        setGstin(e.target.value.toUpperCase())
                      }
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      hasError={!!errors.gstin}
                      aria-required="true"
                    />
                  </Field>
                  <Field label="Business name" error={errors.businessName} required>
                    <Input
                      id="field-businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Sharma Enterprises"
                      hasError={!!errors.businessName}
                      aria-required="true"
                    />
                  </Field>
                </div>
              )}
            </section>
          )}

          {/* Payment method */}
          <section aria-labelledby="payment-heading" className="space-y-4">
            <h2 id="payment-heading" className="font-display text-lg font-bold">
              Payment
            </h2>
            <PaymentMethodTabs
              region={region}
              selected={method}
              onChange={setMethod}
            />

            {/* Gateway unavailable warning */}
            {gatewayUnavailable && method === "online" && (
              <div className="flex items-start gap-3 rounded-xl border border-marigold/60 bg-marigold/10 p-4 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-marigold" />
                <div className="space-y-1">
                  <p className="font-semibold text-ink">
                    Online payment is temporarily unavailable
                  </p>
                  <p className="text-ink-soft text-[13px]">
                    Please place your order via WhatsApp or choose COD
                    {region.codAvailable ? "" : " (unavailable in your region)"}.
                  </p>
                  <a
                    href={whatsappUrl(
                      `Hi! I'd like to place an order on CHOP. — ${resolved.map((l) => `${l.product.name} (${l.variant.label} ×${l.qty})`).join(", ")}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-mint underline-offset-2 hover:underline"
                  >
                    <MessageCircle size={14} />
                    Order on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </section>

          {/* Mobile order summary toggle */}
          <div className="rounded-xl border border-line bg-paper-2 p-4 lg:hidden">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              className="flex w-full items-center justify-between text-[14px] font-semibold"
            >
              <span>Order summary</span>
              <span className="flex items-center gap-2 text-ink-soft">
                {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {summaryOpen && (
              <div className="mt-4">
                <OrderSummary
                  lines={resolved}
                  totals={totals}
                  regionId={seg}
                  couponCode={couponCode}
                />
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-tomato/40 bg-tomato/5 p-4 text-sm"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-tomato" />
              <div className="space-y-2">
                <p className="font-semibold text-tomato">{error}</p>
                <a
                  href={whatsappUrl(
                    `Hi! I had a payment issue on CHOP. — can you help me place an order?`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-mint underline-offset-2 hover:underline"
                >
                  <MessageCircle size={13} />
                  Need help? Order via WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Place order button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {method === "cod" ? "Placing order…" : "Processing payment…"}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock size={15} />
                {method === "cod" ? "Place order" : "Pay securely"}
              </span>
            )}
          </Button>

          <p className="text-center text-[12px] text-ink-soft">
            By placing your order you agree to our{" "}
            <a href="/terms" className="underline hover:text-ink">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-ink">Privacy Policy</a>.
          </p>
        </form>

        {/* ── Order summary sidebar (desktop) ──────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <OrderSummary
              lines={resolved}
              totals={totals}
              regionId={seg}
              couponCode={couponCode}
            />
          </div>
        </aside>
      </div>
    </Container>
  );
}
