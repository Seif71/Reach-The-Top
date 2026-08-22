import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/auction";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "How it works",
  description: "Pay any amount to appear in the rankings. The highest payment holds #1.",
};

export default async function HowPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">How it works</h1>
      <p className="mt-4 text-lg leading-8">
        ReachTheTop is a simple advertising board. Pay any amount at or above the opening price to
        appear in the rankings. The highest confirmed payment holds #1.
      </p>
      <ol className="mt-10 space-y-6 leading-7">
        <li>
          <strong className="text-ink">1. See the board.</strong> Rankings are ordered by how much
          each listing paid. #1, #2, and #3 are marked gold, silver, and bronze.
        </li>
        <li>
          <strong className="text-ink">2. Pay any amount.</strong> The minimum is{" "}
          {formatUsd(settings.startingBidCents)}. You do not have to beat the current #1 to appear
          on the board.
        </li>
        <li>
          <strong className="text-ink">3. Pay with Stripe.</strong> Card details go to Stripe, not
          to this application.
        </li>
        <li>
          <strong className="text-ink">4. Rank by payment.</strong> If you paid more than the live
          #1 amount, you take the top spot. If you paid less, you still list below.
        </li>
      </ol>
      <p className="mt-8 text-sm text-muted">{settings.advertisingRules}</p>
      <Link href="/advertise" className="mt-10 inline-flex rounded-lg bg-gold px-5 py-3 text-sm text-white">
        Advertise
      </Link>
    </div>
  );
}
