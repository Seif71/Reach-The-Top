import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const payments = await prisma.payment.findMany({
    where: status ? { status: status as never } : undefined,
    include: { bid: { include: { advertiser: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Payments</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-6 flex gap-2 text-sm">
        {["", "SUCCEEDED", "FAILED", "REFUNDED", "PENDING", "CANCELED"].map((s) => (
          <a key={s} href={s ? `/admin/payments?status=${s}` : "/admin/payments"} className="rounded-full border border-line px-3 py-1">
            {s || "All"}
          </a>
        ))}
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th>Advertiser</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Stripe</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-3 text-muted">{p.createdAt.toLocaleString()}</td>
                <td>{p.bid.advertiser.name}</td>
                <td>{formatUsd(p.amountCents)}</td>
                <td>{p.status}</td>
                <td className="max-w-[220px] truncate text-xs text-muted">
                  {p.stripeCheckoutSessionId}
                  {p.stripePaymentIntentId ? ` · ${p.stripePaymentIntentId}` : ""}
                  {p.stripeRefundId ? ` · refund ${p.stripeRefundId}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
