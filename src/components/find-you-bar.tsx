"use client";

import { useYou, isYourListing } from "@/lib/you";
import type { BoardListing } from "@/components/ranking-list";

export function FindYouBar({ listings }: { listings: BoardListing[] }) {
  const you = useYou();
  const mine = listings.find((row) => isYourListing(row, you));
  if (!mine) return null;

  function jump() {
    document.getElementById("you")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto mb-4 max-w-4xl px-5">
      <button
        type="button"
        onClick={jump}
        className="flex w-full items-center justify-between rounded-xl border border-green-300 bg-green-200 px-4 py-3 text-left text-sm font-semibold text-ok"
      >
        <span>You are #{mine.rank} on the board</span>
        <span className="inline-flex items-center gap-1">
          Jump to your rank
          <span aria-hidden className="text-lg leading-none">
            ↓
          </span>
        </span>
      </button>
    </div>
  );
}
