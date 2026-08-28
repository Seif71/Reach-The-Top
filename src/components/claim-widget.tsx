"use client";

import { FormEvent, useState } from "react";
import { bumpMoney, formatUsd, parseDollarInput, sanitizeMoneyInput } from "@/lib/money";
import { rememberYou } from "@/lib/you";

type Placement = "first" | "list";

type Props = {
  firstMinCents: number;
  currentBidCents: number;
  hasWinner: boolean;
  incrementCents: number;
  defaultEmail?: string;
  paymentsReady?: boolean;
};

export function ClaimWidget({
  firstMinCents,
  currentBidCents,
  hasWinner,
  defaultEmail,
  paymentsReady = true,
}: Props) {
  const centStep = 1;
  const firstMin = firstMinCents / 100;
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail ?? "");
  const [firstPrice, setFirstPrice] = useState(() =>
    Number.isInteger(firstMin) ? String(firstMin) : firstMin.toFixed(2),
  );
  const [customPrice, setCustomPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<Placement | null>(null);

  const firstCents = parseDollarInput(firstPrice);
  const customCents = parseDollarInput(customPrice);

  async function pay(placement: Placement, bidDollars: number) {
    setError(null);
    if (!websiteUrl.trim() || !contactEmail.trim()) {
      setError("Enter your URL and email first.");
      return;
    }
    if (placement === "list") {
      if (customCents == null || customCents < 100) {
        setError("Enter a custom price of at least $1.00. Cents are allowed, like 1.50.");
        return;
      }
    }
    if (placement === "first") {
      if (firstCents == null || firstCents < firstMinCents) {
        setError(`To take #1, pay at least ${formatUsd(firstMinCents)}.`);
        return;
      }
    }
    setLoading(placement);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl,
          contactEmail,
          bidDollars,
          placement,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout");
      rememberYou({ advertiserId: json.advertiserId, email: contactEmail });
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  const customReady = customCents != null && customCents >= 100;

  return (
    <form id="claim" onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-line bg-white p-6">
        <label className="grid gap-2 text-sm font-medium">
          Website or app URL
          <input
            required
            placeholder="https://yourproduct.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="rounded-lg border border-line px-3 py-2.5 text-base font-normal"
          />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-medium">
          Email
          <input
            required
            type="email"
            placeholder="you@company.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="rounded-lg border border-line px-3 py-2.5 text-base font-normal"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex min-h-[22rem] flex-col rounded-xl border border-line bg-white p-6">
          <p className="text-center text-xl font-bold tracking-tight">Pay for the #1 spot</p>
          <p className="mt-2 text-center text-sm text-muted">
            {hasWinner
              ? `Must be higher than the current #1 at ${formatUsd(currentBidCents)}. Cents count.`
              : "The #1 spot is open. Bidding starts at $1. Cents are allowed."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFirstPrice((value) => bumpMoney(value, -centStep, firstMinCents))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-xl leading-none hover:bg-soft"
              aria-label="Decrease amount"
            >
              −
            </button>
            <span className="text-4xl font-semibold tabular-nums text-gold">$</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={firstPrice}
              onChange={(e) => setFirstPrice(sanitizeMoneyInput(e.target.value))}
              className="w-32 border-0 bg-transparent p-0 text-center text-4xl font-semibold tabular-nums text-gold shadow-none"
            />
            <button
              type="button"
              onClick={() => setFirstPrice((value) => bumpMoney(value, centStep, firstMinCents))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-xl leading-none hover:bg-soft"
              aria-label="Increase amount"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={Boolean(loading) || !paymentsReady}
            onClick={() => pay("first", (firstCents ?? firstMinCents) / 100)}
            className="mt-10 mt-auto w-full rounded-lg bg-[#5c1010] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3f0b0b] disabled:cursor-wait disabled:opacity-80"
          >
            {loading === "first"
              ? "Opening checkout…"
              : `Pay ${formatUsd(firstCents ?? firstMinCents)} for the #1 spot`}
          </button>
        </div>

        <div id="list-pay" className="flex min-h-[22rem] flex-col rounded-xl border border-line bg-white p-6">
          <p className="text-center text-xl font-bold tracking-tight">Pay to be on the rankings</p>
          <p className="mt-2 text-center text-sm text-muted">
            Enter a custom price. Ranked by how much you pay.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCustomPrice((value) => bumpMoney(value, -centStep, 100))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-xl leading-none hover:bg-soft"
              aria-label="Decrease amount"
            >
              −
            </button>
            <span className="text-4xl font-semibold tabular-nums text-gold">$</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={customPrice}
              onChange={(e) => setCustomPrice(sanitizeMoneyInput(e.target.value))}
              className="w-32 border-0 bg-transparent p-0 text-center text-4xl font-semibold tabular-nums text-gold shadow-none"
            />
            <button
              type="button"
              onClick={() => setCustomPrice((value) => bumpMoney(value, centStep, 100))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-xl leading-none hover:bg-soft"
              aria-label="Increase amount"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={Boolean(loading) || !paymentsReady}
            onClick={() => pay("list", (customCents ?? 0) / 100)}
            className="mt-10 mt-auto w-full rounded-lg bg-[#5c1010] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3f0b0b] disabled:cursor-wait disabled:opacity-80"
          >
            {loading === "list"
              ? "Opening checkout…"
              : customReady
                ? `Pay ${formatUsd(customCents)} to be on the rankings`
                : "Pay custom price"}
          </button>
        </div>
      </div>

      {!paymentsReady && (
        <p className="mt-3 text-center text-sm text-danger">
          Stripe is not configured yet. Add your keys to <code>.env</code> and restart the app.
        </p>
      )}
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
    </form>
  );
}
