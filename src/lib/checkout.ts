import { BidStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuctionSnapshot, getSettings } from "@/lib/auction";
import { bidRejectionMessage, minimumValidBidCents } from "@/lib/bidding-rules";
import { dollarsToCents } from "@/lib/money";
import { getAppUrl, getPaymentLinkAmountCents, getPaymentLinkUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { listingInputSchema, normalizeWebsiteUrl } from "@/lib/validation";

export type CheckoutInput = {
  name?: string;
  websiteUrl: string;
  description?: string;
  category?: string;
  contactEmail: string;
  logoUrl?: string;
  bidDollars: number;
  placement?: "first" | "list";
  userId?: string | null;
};

export async function createCheckoutSession(input: CheckoutInput) {
  const parsed = listingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid listing" };
  }

  const snapshot = await getAuctionSnapshot();
  const amountCents = dollarsToCents(parsed.data.bidDollars);
  const placement = parsed.data.placement ?? input.placement ?? "list";
  const rejection = bidRejectionMessage(amountCents, snapshot, placement);
  if (rejection) {
    return { ok: false as const, error: rejection };
  }

  const settings = await getSettings();
  const websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl);
  let host = websiteUrl;
  try {
    host = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    host = websiteUrl;
  }
  const name = parsed.data.name?.trim() || host;
  const description =
    parsed.data.description?.trim() || `Visit ${host}. Advertising placement on ReachTheTop.`;
  const category = parsed.data.category ?? "Other";
  const logoUrl =
    parsed.data.logoUrl?.trim() ||
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  const initialStatus = settings.requireApproval ? "PENDING" : "APPROVED";

  const advertiser = await prisma.advertiser.create({
    data: {
      userId: input.userId ?? undefined,
      name,
      websiteUrl,
      description,
      category,
      logoUrl,
      contactEmail: parsed.data.contactEmail,
      status: initialStatus,
    },
  });

  const bid = await prisma.bid.create({
    data: {
      advertiserId: advertiser.id,
      userId: input.userId ?? undefined,
      amountCents,
      minimumRequiredCents: minimumValidBidCents(snapshot, placement),
      status: BidStatus.PENDING_PAYMENT,
    },
  });

  if (isStripeConfigured()) {
    return createStripeCheckout({
      bidId: bid.id,
      advertiserId: advertiser.id,
      amountCents,
      name,
      email: parsed.data.contactEmail,
      placement,
    });
  }

  const paymentLink = getPaymentLinkUrl();
  if (!paymentLink) {
    await prisma.bid.update({
      where: { id: bid.id },
      data: { status: BidStatus.FAILED, failureReason: "Stripe is not configured." },
    });
    return { ok: false as const, error: "Payments are not configured." };
  }

  const linkAmount = getPaymentLinkAmountCents();
  if (amountCents !== linkAmount) {
    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        status: BidStatus.FAILED,
        failureReason: "Payment link amount does not match this bid.",
      },
    });
    return {
      ok: false as const,
      error: `This Stripe payment link is set to ${linkAmount / 100} USD. The opening bid of $${linkAmount / 100} can use it. For higher bids, add STRIPE_SECRET_KEY from https://dashboard.stripe.com/apikeys`,
    };
  }

  const placeholderSessionId = `plink_${bid.id}`;
  await prisma.payment.create({
    data: {
      bidId: bid.id,
      amountCents,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: placeholderSessionId,
    },
  });
  await prisma.bid.update({
    where: { id: bid.id },
    data: { stripeCheckoutSessionId: placeholderSessionId },
  });

  const url = new URL(paymentLink);
  url.searchParams.set("prefilled_email", parsed.data.contactEmail);
  url.searchParams.set("client_reference_id", bid.id);
  return { ok: true as const, url: url.toString(), bidId: bid.id, advertiserId: advertiser.id };
}

async function createStripeCheckout(input: {
  bidId: string;
  advertiserId: string;
  amountCents: number;
  name: string;
  email: string;
  placement: "first" | "list";
}) {
  const stripe = getStripe();
  const appUrl = getAppUrl();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      success_url: `${appUrl}/advertise/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/advertise/canceled?bid=${input.bidId}`,
      client_reference_id: input.bidId,
      branding_settings: {
        display_name: "ReachTheTop",
      },
      metadata: {
        bidId: input.bidId,
        advertiserId: input.advertiserId,
        amountCents: String(input.amountCents),
        placement: input.placement,
      },
      payment_intent_data: {
        metadata: {
          bidId: input.bidId,
          advertiserId: input.advertiserId,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.amountCents,
            product_data: {
              name:
                input.placement === "first"
                  ? `ReachTheTop — #1 advertising spot (${input.name})`
                  : `ReachTheTop — rankings listing (${input.name})`,
              description:
                input.placement === "first"
                  ? "Paid advertising placement for the #1 spot. Visibility only; results are not guaranteed."
                  : "Paid advertising listing on the rankings board. Visibility only; results are not guaranteed.",
            },
          },
        },
      ],
    });
  } catch {
    await prisma.bid.update({
      where: { id: input.bidId },
      data: { status: BidStatus.FAILED, failureReason: "Stripe Checkout could not be created." },
    });
    return { ok: false as const, error: "Unable to start Stripe Checkout. Please try again." };
  }

  if (!session.url || !session.id) {
    await prisma.bid.update({
      where: { id: input.bidId },
      data: { status: BidStatus.FAILED, failureReason: "Stripe Checkout returned no URL." },
    });
    return { ok: false as const, error: "Unable to start Stripe Checkout. Please try again." };
  }

  await prisma.payment.create({
    data: {
      bidId: input.bidId,
      amountCents: input.amountCents,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: session.id,
    },
  });

  await prisma.bid.update({
    where: { id: input.bidId },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { ok: true as const, url: session.url, bidId: input.bidId, advertiserId: input.advertiserId };
}
