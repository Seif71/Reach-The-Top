import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const positions = await prisma.winningPosition.findMany({
    include: { advertiser: true, bid: true },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">#1 history</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line">
        {positions.map((row) => (
          <div key={row.id} className="px-5 py-4">
            <p>
              {row.advertiser.name} · {formatUsd(row.amountCents)}
              {!row.endedAt && <span className="ml-2 text-gold">current</span>}
            </p>
            <p className="text-xs text-muted">
              {row.startedAt.toLocaleString()} → {row.endedAt ? row.endedAt.toLocaleString() : "now"} · bid {row.bidId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
