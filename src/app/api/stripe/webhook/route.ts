import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  finalizeSuccessfulPayment,
  linkSessionToPendingBid,
  markPaymentCanceled,
  markPaymentFailed,
  markPaymentRefunded,
} from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("...")) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const already = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (already) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid" || session.status === "complete") {
          await linkSessionToPendingBid({
            stripeCheckoutSessionId: session.id,
            bidId: session.client_reference_id ?? session.metadata?.bidId,
          });
          await finalizeSuccessfulPayment({
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : session.customer?.id,
            amountTotal: session.amount_total,
            currency: session.currency,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        await markPaymentFailed(session.id, "Async payment failed");
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        await markPaymentCanceled(session.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const sessionId = intent.metadata?.checkoutSessionId;
        if (typeof intent.id === "string") {
          const payment = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: intent.id },
          });
          if (payment) {
            await markPaymentFailed(payment.stripeCheckoutSessionId, intent.last_payment_error?.message);
          } else if (sessionId) {
            await markPaymentFailed(sessionId, intent.last_payment_error?.message);
          }
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const refunds = charge.refunds;
        const refundId =
          refunds && typeof refunds !== "string" ? refunds.data[0]?.id : undefined;
        await markPaymentRefunded({
          stripePaymentIntentId: pi,
          stripeRefundId: refundId,
        });
        break;
      }
      default:
        break;
    }

    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (error) {
    console.error("Stripe webhook handler failed", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
