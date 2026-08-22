import { BidStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import {
  isStrictlyHigherThanCurrent,
  type AuctionSnapshot,
} from "@/lib/bidding-rules";
import { getStripe } from "@/lib/stripe";

const AUCTION_LOCK_KEY = 814_201;

export type FinalizeResult =
  | { outcome: "won"; positionId: string }
  | { outcome: "listed" }
  | { outcome: "pending_approval" }
  | { outcome: "stale"; refundId: string | null }
  | { outcome: "ignored"; reason: string };

type LockedSnapshot = AuctionSnapshot & {
  currentAdvertiserId: string | null;
  requireApproval: boolean;
};

async function loadLockedSnapshot(tx: Prisma.TransactionClient): Promise<LockedSnapshot> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUCTION_LOCK_KEY})`;
  const [settings, state] = await Promise.all([
    tx.platformSettings.findUnique({ where: { id: "global" } }),
    tx.auctionState.findUnique({ where: { id: "global" } }),
  ]);

  const currentBidCents = state?.currentBidCents ?? 0;

  return {
    currentBidCents,
    hasWinner: Boolean(state?.currentAdvertiserId) && currentBidCents > 0,
    startingBidCents: settings?.startingBidCents ?? 100,
    minIncrementCents: settings?.minIncrementCents ?? 100,
    currentAdvertiserId: state?.currentAdvertiserId ?? null,
    requireApproval: settings?.requireApproval ?? false,
  };
}

async function seatWinner(
  tx: Prisma.TransactionClient,
  bid: { id: string; advertiserId: string; amountCents: number },
) {
  await tx.winningPosition.updateMany({
    where: { endedAt: null },
    data: { endedAt: new Date() },
  });

  const position = await tx.winningPosition.create({
    data: {
      advertiserId: bid.advertiserId,
      bidId: bid.id,
      amountCents: bid.amountCents,
    },
  });

  await tx.auctionState.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      currentBidCents: bid.amountCents,
      currentAdvertiserId: bid.advertiserId,
      currentPositionId: position.id,
      version: 1,
    },
    update: {
      currentBidCents: bid.amountCents,
      currentAdvertiserId: bid.advertiserId,
      currentPositionId: position.id,
      version: { increment: 1 },
    },
  });

  await tx.advertiser.update({
    where: { id: bid.advertiserId },
    data: { status: "APPROVED" },
  });

  return position.id;
}

export async function linkSessionToPendingBid(input: {
  stripeCheckoutSessionId: string;
  bidId?: string | null;
}) {
  const existing = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
  });
  if (existing) return;

  if (!input.bidId) return;
  const bid = await prisma.bid.findUnique({
    where: { id: input.bidId },
    include: { payment: true },
  });
  if (!bid?.payment) return;
  if (bid.payment.status !== PaymentStatus.PENDING) return;

  await prisma.payment.update({
    where: { id: bid.payment.id },
    data: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
  });
  await prisma.bid.update({
    where: { id: bid.id },
    data: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
  });
}

export async function finalizeSuccessfulPayment(input: {
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  stripeChargeId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
}): Promise<FinalizeResult> {
  const decided = await prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
        include: { bid: { include: { advertiser: true } } },
      });

      if (!payment) {
        return { kind: "ignored" as const, reason: "unknown_session" };
      }

      if (
        payment.status === PaymentStatus.REFUNDED ||
        payment.bid.status === BidStatus.SUPERSEDED ||
        payment.bid.status === BidStatus.REFUNDED
      ) {
        return { kind: "ignored" as const, reason: "already_settled" };
      }

      if (payment.status === PaymentStatus.SUCCEEDED && payment.bid.status === BidStatus.SUCCEEDED) {
        return { kind: "ignored" as const, reason: "already_won" };
      }

      const paidAmount = input.amountTotal;
      const currency = input.currency?.toLowerCase();
      if (
        (paidAmount != null && paidAmount !== payment.amountCents) ||
        (currency != null && currency !== "usd") ||
        payment.amountCents !== payment.bid.amountCents
      ) {
        await tx.bid.update({
          where: { id: payment.bid.id },
          data: {
            status: BidStatus.FAILED,
            failureReason: "Paid amount did not match the recorded bid.",
          },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureMessage: "Amount or currency mismatch versus the bid record.",
            stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
          },
        });
        return {
          kind: "stale" as const,
          paymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
          bidId: payment.bid.id,
        };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
          stripeCustomerId: input.stripeCustomerId ?? payment.stripeCustomerId,
          stripeChargeId: input.stripeChargeId ?? payment.stripeChargeId,
        },
      });

      const snapshot = await loadLockedSnapshot(tx);
      const bid = payment.bid;
      const advertiserBlocked = bid.advertiser.status === "REJECTED" || bid.advertiser.status === "REMOVED";

      if (advertiserBlocked) {
        await tx.bid.update({
          where: { id: bid.id },
          data: {
            status: BidStatus.FAILED,
            failureReason: "This listing is not eligible to appear on the board.",
          },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            paidAt: new Date(),
            failureMessage: "Advertiser is blocked.",
          },
        });
        return {
          kind: "stale" as const,
          paymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
          bidId: bid.id,
        };
      }

      if (snapshot.requireApproval && bid.advertiser.status !== "APPROVED") {
        await tx.bid.update({
          where: { id: bid.id },
          data: { status: BidStatus.SUCCEEDED },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCEEDED, paidAt: new Date() },
        });
        await tx.advertiser.update({
          where: { id: bid.advertiserId },
          data: { status: "PENDING" },
        });
        return { kind: "pending_approval" as const };
      }

      const wonFirst = isStrictlyHigherThanCurrent(bid.amountCents, snapshot);
      let positionId: string | null = null;
      if (wonFirst) {
        positionId = await seatWinner(tx, bid);
      } else if (bid.advertiser.status !== "APPROVED") {
        await tx.advertiser.update({
          where: { id: bid.advertiserId },
          data: { status: "APPROVED" },
        });
      }

      await tx.bid.update({
        where: { id: bid.id },
        data: { status: BidStatus.SUCCEEDED, failureReason: null },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, paidAt: new Date() },
      });

      if (positionId) {
        return { kind: "won" as const, positionId, bidId: bid.id };
      }
      return { kind: "listed" as const, bidId: bid.id };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 8000,
      timeout: 15000,
    },
  );

  if (decided.kind === "stale") {
    let refundId: string | null = null;
    if (decided.paymentIntentId) {
      const refund = await getStripe().refunds.create({
        payment_intent: decided.paymentIntentId,
        reason: "requested_by_customer",
        metadata: { reason: "stale_bid", bidId: decided.bidId },
      });
      refundId = refund.id;
      await prisma.payment.updateMany({
        where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
        data: { stripeRefundId: refundId, refundedAt: new Date() },
      });
    }
    await writeAudit({
      action: "bid.stale_refunded",
      entityType: "Bid",
      entityId: decided.bidId,
      metadata: { refundId },
    });
    revalidatePublic();
    return { outcome: "stale", refundId };
  }

  if (decided.kind === "won") {
    await writeAudit({
      action: "bid.won",
      entityType: "Bid",
      entityId: decided.bidId,
    });
    revalidatePublic();
    return { outcome: "won", positionId: decided.positionId };
  }

  if (decided.kind === "listed") {
    await writeAudit({
      action: "bid.listed",
      entityType: "Bid",
      entityId: decided.bidId,
    });
    revalidatePublic();
    return { outcome: "listed" };
  }

  if (decided.kind === "pending_approval") {
    revalidatePublic();
    return { outcome: "pending_approval" };
  }

  return { outcome: "ignored", reason: decided.reason };
}

export async function seatPaidBidIfStillWinning(bidId: string) {
  return prisma.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({
      where: { id: bidId },
      include: { advertiser: true, payment: true, winningPosition: true },
    });
    if (!bid || bid.winningPosition) return { ok: false as const, error: "Already seated or missing." };
    if (bid.status !== BidStatus.SUCCEEDED) return { ok: false as const, error: "Bid is not a successful payment." };
    if (bid.payment?.status !== PaymentStatus.SUCCEEDED) {
      return { ok: false as const, error: "Payment is not successful." };
    }

    const snapshot = await loadLockedSnapshot(tx);
    if (!isStrictlyHigherThanCurrent(bid.amountCents, snapshot)) {
      return { ok: true as const, positionId: null };
    }

    const positionId = await seatWinner(tx, bid);
    return { ok: true as const, positionId };
  });
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/advertise");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function markPaymentFailed(stripeCheckoutSessionId: string, message?: string) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId },
  });
  if (!payment || payment.status === PaymentStatus.SUCCEEDED) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      failureMessage: message ?? "Payment failed",
    },
  });
  await prisma.bid.update({
    where: { id: payment.bidId },
    data: {
      status: BidStatus.FAILED,
      failureReason: message ?? "Payment failed",
    },
  });
}

export async function markPaymentCanceled(stripeCheckoutSessionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId },
  });
  if (!payment || payment.status === PaymentStatus.SUCCEEDED) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.CANCELED },
  });
  await prisma.bid.update({
    where: { id: payment.bidId },
    data: { status: BidStatus.CANCELED, failureReason: "Checkout canceled" },
  });
}

export async function markPaymentRefunded(input: {
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeRefundId?: string | null;
}) {
  const payment = input.stripeCheckoutSessionId
    ? await prisma.payment.findUnique({
        where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
      })
    : input.stripePaymentIntentId
      ? await prisma.payment.findFirst({
          where: { stripePaymentIntentId: input.stripePaymentIntentId },
        })
      : null;

  if (!payment) return;
  if (payment.status === PaymentStatus.REFUNDED && payment.stripeRefundId) return;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUCTION_LOCK_KEY})`;

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        stripeRefundId: input.stripeRefundId ?? payment.stripeRefundId,
        refundedAt: new Date(),
      },
    });
    await tx.bid.update({
      where: { id: payment.bidId },
      data: {
        status: BidStatus.REFUNDED,
        failureReason: "Payment refunded",
      },
    });

    const seated = await tx.winningPosition.findUnique({ where: { bidId: payment.bidId } });
    const state = await tx.auctionState.findUnique({ where: { id: "global" } });
    if (!seated || state?.currentPositionId !== seated.id) return;

    await tx.winningPosition.update({
      where: { id: seated.id },
      data: { endedAt: new Date() },
    });

    const previous = await tx.winningPosition.findFirst({
      where: {
        id: { not: seated.id },
        advertiser: { status: "APPROVED" },
      },
      orderBy: { startedAt: "desc" },
    });

    if (previous) {
      await tx.winningPosition.update({
        where: { id: previous.id },
        data: { endedAt: null },
      });
      await tx.auctionState.update({
        where: { id: "global" },
        data: {
          currentAdvertiserId: previous.advertiserId,
          currentPositionId: previous.id,
          currentBidCents: previous.amountCents,
          version: { increment: 1 },
        },
      });
    } else {
      await tx.auctionState.update({
        where: { id: "global" },
        data: {
          currentAdvertiserId: null,
          currentPositionId: null,
          currentBidCents: 0,
          version: { increment: 1 },
        },
      });
    }
  });

  revalidatePublic();
}
