import Link from "next/link";
import type { Advertiser } from "@prisma/client";
import { BidAmount, LogoMark, formatHost } from "@/components/brand";

export function FeaturedCard({
  advertiser,
  bidCents,
  minimumBidCents,
}: {
  advertiser: Advertiser;
  bidCents: number;
  minimumBidCents: number;
}) {
  return (
    <article className="relative rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
      <div className="absolute right-5 top-5 rounded-md bg-gold px-2.5 py-1 text-xs font-semibold text-white">
        #1
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <LogoMark advertiser={advertiser} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Current #1 advertiser</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{advertiser.name}</h2>
          <p className="mt-3 max-w-xl text-base leading-7">{advertiser.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-elev px-3 py-1 text-muted">{advertiser.category}</span>
            <a href={advertiser.websiteUrl} className="rounded-full bg-elev px-3 py-1 text-gold">
              {formatHost(advertiser.websiteUrl)}
            </a>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted">Current #1 bid</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-gold">
                <BidAmount cents={bidCents} />
              </p>
              <p className="mt-2 text-sm text-muted">
                Want #1? Bid higher — minimum <BidAmount cents={minimumBidCents} />.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={advertiser.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-5 py-3 text-center text-sm hover:bg-elev"
              >
                Visit website
              </a>
              <Link
                href="/advertise"
                className="rounded-lg bg-gold px-5 py-3 text-center text-sm font-medium text-white hover:bg-gold-2"
              >
                Beat this bid
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function EmptyFeatured({ startingBidCents }: { startingBidCents: number }) {
  return (
    <article className="rounded-2xl border border-dashed border-line bg-elev p-10 text-center">
      <p className="text-sm text-muted">The #1 spot is open</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">No advertiser holds #1 yet.</h2>
      <p className="mx-auto mt-3 max-w-lg">
        Be the first. The opening bid is <BidAmount cents={startingBidCents} />.
      </p>
      <Link
        href="/advertise"
        className="mt-6 inline-flex rounded-lg bg-gold px-5 py-3 text-sm font-medium text-white"
      >
        Take the #1 spot
      </Link>
    </article>
  );
}
