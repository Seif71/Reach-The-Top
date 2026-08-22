"use client";

import { FormEvent, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { dollarsToCents, formatUsd } from "@/lib/money";

type Props = {
  minimumBidCents: number;
  currentBidCents: number;
  hasWinner: boolean;
  defaultEmail?: string;
};

type Step = "form" | "confirm";

export function BidForm({ minimumBidCents, currentBidCents, hasWinner, defaultEmail }: Props) {
  const minDollars = minimumBidCents / 100;
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [values, setValues] = useState({
    name: "",
    websiteUrl: "",
    description: "",
    category: "SaaS",
    contactEmail: defaultEmail ?? "",
    bidDollars: String(minDollars),
  });

  const bidCents = dollarsToCents(Number(values.bidDollars));
  const clientError = useMemo(() => {
    if (!values.bidDollars) return "Enter a bid amount.";
    if (bidCents < minimumBidCents) {
      return `The minimum listing amount is ${formatUsd(minimumBidCents)}.`;
    }
    return null;
  }, [bidCents, currentBidCents, hasWinner, minimumBidCents, values.bidDollars]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setLogoUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function toConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (clientError) {
      setError(clientError);
      return;
    }
    setStep("confirm");
  }

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, bidDollars: Number(values.bidDollars), logoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (step === "confirm") {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <p className="text-sm text-muted">Confirm your bid</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          You are bidding {formatUsd(bidCents)} for the #1 advertising position.
        </h2>
        <p className="mt-4">
          By completing payment, your business will become the #1 promoted listing if this payment
          is successfully processed and still exceeds the live winning bid at confirmation time.
        </p>
        <dl className="mt-8 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted">Business</dt>
            <dd>{values.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Website</dt>
            <dd>{values.websiteUrl}</dd>
          </div>
          <div>
            <dt className="text-muted">Category</dt>
            <dd>{values.category}</dd>
          </div>
          <div>
            <dt className="text-muted">Bid</dt>
            <dd className="text-gold">{formatUsd(bidCents)}</dd>
          </div>
        </dl>
        {error && <p className="mt-6 text-sm text-danger">{error}</p>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="rounded-lg border border-line px-5 py-3 text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={pay}
            disabled={loading}
            className="rounded-lg bg-gold px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Opening Stripe…" : "Pay with Stripe"}
          </button>
        </div>
        <p className="mt-6 text-xs leading-5 text-muted">
          If another advertiser becomes #1 before your payment completes, your bid will not take the
          spot and the payment will be refunded. You are purchasing advertising placement, not
          guaranteed traffic or sales.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={toConfirm} className="rounded-2xl border border-line bg-white p-6 md:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm">
          Business / app name
          <input
            required
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Website or app URL
          <input
            required
            placeholder="https://"
            value={values.websiteUrl}
            onChange={(e) => setValues({ ...values, websiteUrl: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Short description
          <textarea
            required
            rows={4}
            maxLength={280}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Category
          <select
            value={values.category}
            onChange={(e) => setValues({ ...values, category: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3"
          >
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Contact email
          <input
            type="email"
            required
            value={values.contactEmail}
            onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <div className="grid gap-2 text-sm">
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
            className="rounded-xl border border-line px-4 py-3 file:mr-3 file:rounded-md file:border-0 file:bg-gold file:px-3 file:py-1 file:text-white"
          />
          {uploading && <p className="text-muted">Uploading…</p>}
          {logoUrl && <p className="text-ok">Logo added.</p>}
        </div>
        <label className="grid gap-2 text-sm">
          Your bid (USD)
          <input
            required
            type="number"
            min={minDollars}
            step={0.01}
            value={values.bidDollars}
            onChange={(e) => setValues({ ...values, bidDollars: e.target.value })}
            className="rounded-2xl border border-line px-4 py-3 text-2xl"
          />
          <span className="text-muted">
            Current #1 {hasWinner ? formatUsd(currentBidCents) : "is open"}. Pay any amount from{" "}
            {formatUsd(minimumBidCents)} to appear in the rankings.
          </span>
        </label>
      </div>
      {(error || clientError) && (
        <p className="mt-5 text-sm text-danger">{error ?? clientError}</p>
      )}
      <button className="mt-8 w-full rounded-lg bg-gold py-3 text-sm font-medium text-white">
        Review bid
      </button>
    </form>
  );
}
