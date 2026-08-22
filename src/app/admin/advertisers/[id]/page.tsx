import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { updateAdvertiserAction } from "@/app/actions/admin";
import { CATEGORIES } from "@/lib/categories";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdvertiserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const advertiser = await prisma.advertiser.findUnique({
    where: { id },
    include: {
      bids: { include: { payment: true, winningPosition: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!advertiser) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <AdminNav />
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">{advertiser.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {advertiser.status} · created {advertiser.createdAt.toLocaleString()}
      </p>
      <form action={updateAdvertiserAction.bind(null, advertiser.id)} className="mt-8 grid gap-4">
        <input name="name" defaultValue={advertiser.name} className="rounded-2xl border border-line px-4 py-3" />
        <input name="websiteUrl" defaultValue={advertiser.websiteUrl} className="rounded-2xl border border-line px-4 py-3" />
        <textarea name="description" defaultValue={advertiser.description} className="rounded-2xl border border-line px-4 py-3" />
        <select name="category" defaultValue={advertiser.category} className="rounded-2xl border border-line px-4 py-3">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="logoUrl" defaultValue={advertiser.logoUrl ?? ""} className="rounded-2xl border border-line px-4 py-3" />
        <button className="rounded-lg bg-gold py-3 text-sm text-white">Save</button>
      </form>
      <h2 className="mt-12 text-2xl font-semibold tracking-tight">Bids</h2>
      <div className="mt-4 divide-y divide-line">
        {advertiser.bids.map((bid) => (
          <div key={bid.id} className="py-4 text-sm">
            <p>
              {formatUsd(bid.amountCents)} · {bid.status}
            </p>
            <p className="text-xs text-muted">
              {bid.createdAt.toLocaleString()} · payment {bid.payment?.status} ·{" "}
              {bid.payment?.stripeCheckoutSessionId} · {bid.payment?.stripePaymentIntentId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
