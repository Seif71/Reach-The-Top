import { redirect } from "next/navigation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { finalizeSuccessfulPayment } from "@/lib/payments";
import { RefreshOnPending } from "@/components/refresh-on-pending";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let status: "won" | "pending" | "stale" | "processing" = "processing";
  let advertiserId: string | null = null;

  if (sessionId && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await finalizeSuccessfulPayment({
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer?.id,
          amountTotal: session.amount_total,
          currency: session.currency,
        });
      }

      const payment = await prisma.payment.findUnique({
        where: { stripeCheckoutSessionId: session.id },
        include: { bid: true },
      });
      if (payment) {
        advertiserId = payment.bid.advertiserId;
        if (payment.bid.status === "SUCCEEDED") {
          const seated = await prisma.winningPosition.findUnique({ where: { bidId: payment.bidId } });
          status = seated ? "won" : "pending";
        } else if (payment.bid.status === "SUPERSEDED" || payment.status === "REFUNDED") {
          status = "stale";
        } else if (session.payment_status === "paid") {
          status = "pending";
        }
      }
    } catch {
      status = "processing";
    }
  }

  if (status === "won" || status === "pending") {
    const you = advertiserId ? `&you=${encodeURIComponent(advertiserId)}` : "";
    redirect(`/?paid=1${you}`);
  }
  if (status === "stale") {
    redirect("/?paid=stale");
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <RefreshOnPending active />
      <h1 className="text-3xl font-semibold tracking-tight">Confirming your payment…</h1>
      <p className="mt-4">Taking you back to the board.</p>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-gold px-5 py-3 text-sm text-white">
        Go to homepage
      </Link>
    </div>
  );
}
