import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatUsd } from "@/lib/money";
import { getLiveAuction } from "@/lib/auction";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [{ _sum, _count }, failed, refunds, highest, advertisers, auction] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.count({ where: { status: "REFUNDED" } }),
    prisma.bid.aggregate({ where: { status: "SUCCEEDED" }, _max: { amountCents: true } }),
    prisma.advertiser.count({ where: { status: { not: "REMOVED" } } }),
    getLiveAuction(),
  ]);

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED", paidAt: { not: null } },
    select: { amountCents: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const p of payments) {
    const key = p.paidAt!.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + p.amountCents);
  }
  const trend = [...byDay.entries()].slice(-14);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Admin</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Platform</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Stat label="Total revenue" value={formatUsd(_sum.amountCents ?? 0)} />
        <Stat label="Successful bids" value={String(_count)} />
        <Stat
          label="Current #1 bid"
          value={auction.snapshot.hasWinner ? formatUsd(auction.snapshot.currentBidCents) : "Open"}
        />
        <Stat label="Highest historical bid" value={formatUsd(highest._max.amountCents ?? 0)} />
        <Stat label="Advertisers" value={String(advertisers)} />
        <Stat label="Failed / refunds" value={`${failed} / ${refunds}`} />
      </div>
      <section className="mt-10 rounded-2xl border border-line bg-elev p-6">
        <h2 className="text-xl font-semibold tracking-tight">Revenue over time</h2>
        <div className="mt-6 flex h-40 items-end gap-2">
          {trend.length === 0 && <p className="text-sm text-muted">No successful payments yet.</p>}
          {trend.map(([day, cents]) => {
            const max = Math.max(...trend.map(([, v]) => v), 1);
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gold/80"
                  style={{ height: `${Math.max(8, (cents / max) * 140)}px` }}
                  title={`${day}: ${formatUsd(cents)}`}
                />
                <span className="text-[10px] text-muted">{day.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </section>
      {auction.currentAdvertiser && (
        <section className="mt-8 rounded-2xl border border-gold/20 bg-elev p-6">
          <h2 className="text-xl font-semibold tracking-tight">Current #1</h2>
          <p className="mt-2">
            {auction.currentAdvertiser.name} · {formatUsd(auction.snapshot.currentBidCents)}
          </p>
          <p className="text-sm text-muted">{auction.currentAdvertiser.websiteUrl}</p>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elev p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
