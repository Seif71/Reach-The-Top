"use client";

import { useEffect, useState } from "react";

const KEY = "rtt:you";

type Stored = {
  ids: string[];
  email?: string;
};

function readStored(): Stored {
  if (typeof window === "undefined") return { ids: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ids: [] };
    const parsed = JSON.parse(raw) as Stored;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      email: parsed.email,
    };
  } catch {
    return { ids: [] };
  }
}

export function rememberYou(input: { advertiserId?: string | null; email?: string | null }) {
  const current = readStored();
  if (input.advertiserId) {
    current.ids = [...new Set([...current.ids, input.advertiserId])];
  }
  if (input.email) current.email = input.email.toLowerCase();
  window.localStorage.setItem(KEY, JSON.stringify(current));
}

export function isYourListing(
  listing: { advertiser: { id: string; contactEmail: string } },
  you: Stored,
) {
  if (you.ids.includes(listing.advertiser.id)) return true;
  if (you.email && listing.advertiser.contactEmail.toLowerCase() === you.email) return true;
  return false;
}

export function useYou(viewerEmail?: string | null) {
  const [you, setYou] = useState<Stored>({ ids: [], email: viewerEmail ?? undefined });

  useEffect(() => {
    const stored = readStored();
    if (viewerEmail) stored.email = stored.email ?? viewerEmail.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("you");
    if (fromQuery) {
      rememberYou({ advertiserId: fromQuery, email: stored.email });
      stored.ids = [...new Set([...stored.ids, fromQuery])];
    }
    setYou(stored);
  }, [viewerEmail]);

  return you;
}

export const youRowClass =
  "border-l-4 border-l-ok bg-green-200";
