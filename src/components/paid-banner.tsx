"use client";

import { useState } from "react";

export function PaidBanner({ stale }: { stale?: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className={`border-b border-line px-5 py-3 text-center text-sm ${stale ? "bg-red-50 text-danger" : "bg-zinc-50"}`}>
      {stale
        ? "The #1 bid increased before payment was confirmed. The charge was refunded."
        : "Payment received. Your listing is on the rankings."}
      <button type="button" onClick={() => setOpen(false)} className="ml-3 text-muted underline">
        Dismiss
      </button>
    </div>
  );
}
