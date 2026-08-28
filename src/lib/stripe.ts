import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("...")) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes("..."));
}

export function getPaymentLinkUrl(): string | null {
  const url = process.env.STRIPE_PAYMENT_LINK_URL?.trim();
  if (!url || !url.startsWith("https://buy.stripe.com/")) return null;
  return url.replace(/\/$/, "");
}

export function getPaymentLinkAmountCents(): number {
  const raw = Number(process.env.STRIPE_PAYMENT_LINK_AMOUNT_CENTS ?? 800);
  return Number.isFinite(raw) && raw > 0 ? raw : 800;
}

export function isPaymentsReady(): boolean {
  return isStripeConfigured() || Boolean(getPaymentLinkUrl());
}

export function getAppUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
  ];

  for (const raw of candidates) {
    const value = raw?.trim().replace(/\/$/, "");
    if (!value) continue;
    try {
      return new URL(value.includes("://") ? value : `https://${value}`).origin;
    } catch {
      continue;
    }
  }

  return "http://localhost:3000";
}
