"use client";

import { LogoMark } from "@/components/site-icon";
import { formatHost } from "@/components/brand";
import { formatUsd } from "@/lib/money";
import { LiveRefresh } from "@/components/live-refresh";
import type { BoardListing } from "@/components/ranking-list";
import { isYourListing, useYou, youRowClass } from "@/lib/you";

function jumpToRank(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ListingRow({
  row,
  mine,
  showHost,
}: {
  row: BoardListing;
  mine: boolean;
  showHost?: boolean;
}) {
  return (
    <li
      id={mine ? "you" : `rank-${row.rank}`}
      className={`flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 ${mine ? youRowClass : ""}`}
    >
      <span className="w-7 shrink-0 text-sm font-black tabular-nums">{row.rank}</span>
      <LogoMark advertiser={row.advertiser} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {row.advertiser.name}
          {mine && <span className="ml-2 text-xs font-bold uppercase tracking-wide text-ok">You</span>}
        </p>
        {showHost && (
          <p className="truncate text-xs text-muted">{formatHost(row.advertiser.websiteUrl)}</p>
        )}
      </div>
      <p className="text-sm font-semibold tabular-nums">{formatUsd(row.amountCents)}</p>
    </li>
  );
}

export function LiveTrending({
  topTen,
  rest,
  viewerEmail,
}: {
  topTen: BoardListing[];
  rest: BoardListing[];
  viewerEmail?: string | null;
}) {
  const you = useYou(viewerEmail);
  const yours = [...topTen, ...rest].find((row) => isYourListing(row, you));
  const yoursInRest = Boolean(yours && rest.some((row) => row.advertiser.id === yours.advertiser.id));

  return (
    <section id="live" className="mx-auto max-w-4xl px-5 pb-10">
      <LiveRefresh />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <article className="flex max-h-[36rem] flex-col overflow-hidden rounded-xl border border-line bg-white">
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Live</h2>
              <p className="text-[11px] text-muted">Ranks 11 and below</p>
            </div>
            <div className="flex items-center gap-2">
              {yoursInRest && yours && (
                <button
                  type="button"
                  onClick={() => jumpToRank("you")}
                  className="inline-flex items-center gap-1 rounded-md bg-green-200 px-2 py-1 text-xs font-bold text-ok"
                >
                  #{yours.rank}
                  <span aria-hidden className="text-sm leading-none">
                    ↓
                  </span>
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                Live
              </span>
            </div>
          </header>
          <ol className="min-h-0 flex-1 overflow-y-auto">
            {rest.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted">
                {topTen.length === 0
                  ? "No listings yet. Be the first."
                  : "Everyone is in the top 10 on Trending."}
              </li>
            )}
            {rest.map((row) => (
              <ListingRow key={row.advertiser.id} row={row} mine={isYourListing(row, you)} showHost />
            ))}
          </ol>
          <a
            href="#list-pay"
            className="block shrink-0 border-t border-line px-4 py-3 text-center text-sm font-semibold text-gold hover:bg-soft"
          >
            Pay to be on the rankings
          </a>
        </article>

        <article className="flex max-h-[36rem] flex-col overflow-hidden rounded-xl border border-line bg-white">
          <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Trending</h2>
              <p className="text-[11px] text-muted">Top 10 by payment</p>
            </div>
            {yours && yours.rank <= 10 && (
              <button
                type="button"
                onClick={() => jumpToRank("you")}
                className="inline-flex items-center gap-1 rounded-md bg-green-200 px-2 py-1 text-xs font-bold text-ok"
              >
                #{yours.rank}
                <span aria-hidden className="text-sm leading-none">
                  ↓
                </span>
              </button>
            )}
          </header>
          <ol className="min-h-0 flex-1 overflow-y-auto">
            {topTen.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted">No listings yet. Be the first.</li>
            )}
            {topTen.map((row) => (
              <ListingRow key={row.advertiser.id} row={row} mine={isYourListing(row, you)} showHost />
            ))}
          </ol>
          <a
            href="#claim"
            className="block shrink-0 border-t border-line px-4 py-3 text-center text-sm font-semibold text-gold hover:bg-soft"
          >
            Pay for the #1 spot
          </a>
        </article>
      </div>
    </section>
  );
}
