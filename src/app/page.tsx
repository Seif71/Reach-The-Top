import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getLiveAuction } from "@/lib/auction";
import { prisma } from "@/lib/prisma";
import { ClaimWidget } from "@/components/claim-widget";
import { RankingList, type BoardListing } from "@/components/ranking-list";
import { LiveTrending } from "@/components/live-trending";
import { FindYouBar } from "@/components/find-you-bar";
import { PaidBanner } from "@/components/paid-banner";
import { isPaymentsReady } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ReachTheTop — Advertising board",
  description: "Pay any amount to appear in the rankings. The highest payment holds the #1 advertising place.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; you?: string }>;
}) {
  const { paid } = await searchParams;
  const session = await auth();
  const { currentAdvertiser, snapshot, firstPlaceMinCents, settings } =
    await getLiveAuction();

  const advertisers = await prisma.advertiser
    .findMany({
      where: { status: { not: "REMOVED" } },
      include: {
        bids: {
          where: { status: "SUCCEEDED" },
          orderBy: { amountCents: "desc" },
          take: 1,
        },
      },
    })
    .catch((error) => {
      console.error("homepage listings failed", error);
      return [];
    });

  const ranked = advertisers
    .map((advertiser) => ({
      advertiser,
      amountCents:
        snapshot.hasWinner && advertiser.id === currentAdvertiser?.id
          ? snapshot.currentBidCents
          : (advertiser.bids[0]?.amountCents ?? 0),
      current: Boolean(snapshot.hasWinner && advertiser.id === currentAdvertiser?.id),
    }))
    .filter((row) => row.amountCents > 0)
    .sort((a, b) => {
      if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
      if (a.current !== b.current) return a.current ? -1 : 1;
      return 0;
    });

  const listings: BoardListing[] = ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
  const topTen = listings.slice(0, 10);
  const rest = listings.slice(10);

  return (
    <div>
      {paid === "1" && <PaidBanner />}
      {paid === "stale" && <PaidBanner stale />}

      <section className="px-5 pb-12 pt-10 sm:pt-12">
        <h1 className="text-center text-3xl font-semibold tracking-tight">Get seen on the board.</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Pay for the #1 spot, or pay to appear on the live rankings. Highest payment still holds
          #1.
        </p>
        <div className="mt-6">
          <ClaimWidget
            firstMinCents={firstPlaceMinCents}
            currentBidCents={snapshot.currentBidCents}
            hasWinner={snapshot.hasWinner}
            incrementCents={settings.minIncrementCents}
            defaultEmail={session?.user?.email}
            paymentsReady={isPaymentsReady()}
          />
        </div>
      </section>

      <FindYouBar listings={listings} />

      <LiveTrending topTen={topTen} rest={rest} viewerEmail={session?.user?.email} />

      <RankingList listings={listings} viewerEmail={session?.user?.email} />

      <section id="rules" className="mx-auto max-w-3xl px-5 pb-20 pt-4">
        <h2 className="text-lg font-semibold tracking-tight">Rules</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          ReachTheTop is a paid advertising board. Placement is sold on a highest-confirmed-payment
          basis. Card details are processed by Stripe and are not stored by this application.
        </p>
        <ol className="mt-6 space-y-5">
          <li>
            <p className="text-sm font-semibold text-ink">1. How you appear</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              Pay for the #1 spot by submitting an amount strictly higher than the current #1
              price. If the spot is vacant, bidding opens at $1.00. Alternatively, pay a custom
              amount of $1.00 or more to appear on the rankings without taking #1 unless your
              payment is the highest on the board.
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-ink">2. How the board is ordered</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              Listings are ranked by confirmed payment, highest first. Cents are permitted.
              Trending displays the top ten listings. Live displays every listing below that
              position.
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-ink">3. Holding #1</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              The current #1 listing remains in first place until another advertiser completes a
              higher confirmed payment.
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-ink">4. What you are purchasing</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              You are purchasing advertising placement and a public link to your site. Traffic,
              clicks, sales, downloads, and other results are not guaranteed. This is not gambling.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
