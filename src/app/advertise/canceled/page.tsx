import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markPaymentCanceled } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function CanceledPage({
  searchParams,
}: {
  searchParams: Promise<{ bid?: string }>;
}) {
  const { bid } = await searchParams;
  if (bid) {
    const record = await prisma.bid.findUnique({
      where: { id: bid },
      include: { payment: true },
    });
    if (
      record?.stripeCheckoutSessionId &&
      record.status === "PENDING_PAYMENT" &&
      record.payment?.status !== "SUCCEEDED"
    ) {
      await markPaymentCanceled(record.stripeCheckoutSessionId);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Checkout canceled</h1>
      <p className="mt-4 leading-7">
        No charge was completed. The #1 spot is unchanged. You can start a new bid whenever you are ready.
      </p>
      <Link href="/advertise" className="mt-8 inline-flex rounded-lg bg-gold px-5 py-3 text-sm text-white">
        Return to bidding
      </Link>
    </div>
  );
}
