"use client";

import type { Advertiser } from "@prisma/client";
import { LogoMark } from "@/components/site-icon";
import { formatHost } from "@/components/brand";
import { formatUsd } from "@/lib/money";
import { isYourListing, useYou, youRowClass } from "@/lib/you";

export type BoardListing = {
  rank: number;
  amountCents: number;
  current: boolean;
  advertiser: Advertiser;
};

const SLOTS = 6;

const PODIUM: Record<
  1 | 2 | 3,
  { row: string; badge: string; ring: string; label: string }
> = {
  1: {
    row: "bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-50",
    badge: "bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-2 ring-amber-400",
    ring: "ring-2 ring-amber-400",
    label: "Gold",
  },
  2: {
    row: "bg-gradient-to-r from-zinc-200/90 via-slate-50 to-zinc-100",
    badge: "bg-gradient-to-b from-zinc-100 to-zinc-400 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-2 ring-zinc-400",
    ring: "ring-2 ring-zinc-400",
    label: "Silver",
  },
  3: {
    row: "bg-gradient-to-r from-orange-200/80 via-orange-50 to-amber-100/70",
    badge: "bg-gradient-to-b from-orange-300 to-amber-800 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ring-2 ring-amber-700",
    ring: "ring-2 ring-amber-700",
    label: "Bronze",
  },
};

function RankBadge({ rank }: { rank: number }) {
  const podium = rank === 1 || rank === 2 || rank === 3 ? PODIUM[rank] : null;
  if (!podium) {
    return <span className="w-11 text-center text-sm tabular-nums text-muted">{rank}</span>;
  }

  return (
    <span
      title={`${podium.label} — #${rank}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black tabular-nums ${podium.badge}`}
    >
      {rank}
    </span>
  );
}

export function RankingList({
  listings,
  viewerEmail,
}: {
  listings: BoardListing[];
  viewerEmail?: string | null;
}) {
  const you = useYou(viewerEmail);
  const slotCount = Math.max(SLOTS, listings.length);
  const rows = Array.from({ length: slotCount }, (_, index) => {
    const rank = index + 1;
    return listings.find((row) => row.rank === rank) ?? null;
  });

  return (
    <section id="rankings" className="mx-auto max-w-4xl px-5 pb-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Rankings</h2>
        <p className="text-sm text-muted">Highest payment is #1</p>
      </div>
      <ol className="overflow-hidden rounded-xl border border-line bg-white">
        {rows.map((row, index) => {
          const rank = index + 1;
          const podium = rank === 1 || rank === 2 || rank === 3 ? PODIUM[rank] : null;

          if (!row) {
            return (
              <li
                key={rank}
                className={`flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 ${podium?.row ?? ""}`}
              >
                <RankBadge rank={rank} />
                <p className="text-sm text-muted">Open</p>
              </li>
            );
          }

          const mine = isYourListing(row, you);

          return (
            <li
              id={mine ? "you-full" : undefined}
              key={row.advertiser.id}
              className={`flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 ${mine ? youRowClass : podium?.row ?? ""}`}
            >
              <RankBadge rank={rank} />
              <span className={`rounded-lg ${podium?.ring ?? ""}`}>
                <LogoMark advertiser={row.advertiser} size="sm" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate ${podium || mine ? "font-bold tracking-tight" : "font-medium"}`}>
                  {row.advertiser.name}
                  {mine && <span className="ml-2 text-xs font-bold uppercase tracking-wide text-ok">You</span>}
                </p>
                <a
                  href={row.advertiser.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-muted hover:text-ink"
                >
                  {formatHost(row.advertiser.websiteUrl)}
                </a>
              </div>
              <p className={`text-sm tabular-nums ${podium || mine ? "font-bold" : ""}`}>
                {row.amountCents > 0 ? formatUsd(row.amountCents) : "—"}
              </p>
              <a
                href={row.advertiser.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden text-sm font-semibold text-muted hover:text-ink sm:inline"
              >
                Visit
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
