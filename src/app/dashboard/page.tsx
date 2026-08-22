import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOwnListingAction } from "@/app/actions/admin";
import { BidAmount, LogoMark } from "@/components/brand";
import { CATEGORIES } from "@/lib/categories";
import { formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const advertisers = await prisma.advertiser.findMany({
    where: { OR: [{ userId }, { contactEmail: session!.user.email }] },
    include: {
      bids: { include: { payment: true, winningPosition: true }, orderBy: { createdAt: "desc" } },
      winningPositions: { orderBy: { startedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const state = await prisma.auctionState.findUnique({ where: { id: "global" } });

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Advertiser</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your listings</h1>
      <p className="mt-3 text-muted">Signed in as {session!.user.email}</p>

      {advertisers.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-muted">You have not submitted a business yet.</p>
          <a href="/advertise" className="mt-4 inline-flex rounded-lg bg-gold px-5 py-3 text-sm text-white">
            Bid for #1
          </a>
        </div>
      )}

      <div className="mt-10 grid gap-8">
        {advertisers.map((advertiser) => {
          const isNumberOne = state?.currentAdvertiserId === advertiser.id;
          const lastWin = advertiser.winningPositions[0];
          return (
            <section key={advertiser.id} className="rounded-2xl border border-line bg-elev p-6 md:p-8">
              <div className="flex items-start gap-4">
                <LogoMark advertiser={advertiser} size="md" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight">{advertiser.name}</h2>
                    {isNumberOne && (
                      <span className="rounded-lg bg-gold px-3 py-1 text-xs font-semibold text-white">#1 now</span>
                    )}
                    <span className="text-xs uppercase tracking-wide text-muted">{advertiser.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6">{advertiser.description}</p>
                  {lastWin?.endedAt && !isNumberOne && (
                    <p className="mt-3 text-sm text-gold">
                      You lost #1 on {lastWin.endedAt.toLocaleString()} after holding it at{" "}
                      {formatUsd(lastWin.amountCents)}.
                    </p>
                  )}
                </div>
              </div>

              <form action={updateOwnListingAction.bind(null, advertiser.id)} className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Name
                  <input name="name" defaultValue={advertiser.name} className="rounded-2xl border border-line px-4 py-3" />
                </label>
                <label className="grid gap-2 text-sm">
                  Website
                  <input name="websiteUrl" defaultValue={advertiser.websiteUrl} className="rounded-2xl border border-line px-4 py-3" />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  Description
                  <textarea name="description" defaultValue={advertiser.description} className="rounded-2xl border border-line px-4 py-3" />
                </label>
                <label className="grid gap-2 text-sm">
                  Category
                  <select name="category" defaultValue={advertiser.category} className="rounded-2xl border border-line px-4 py-3">
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Logo URL
                  <input name="logoUrl" defaultValue={advertiser.logoUrl ?? ""} className="rounded-2xl border border-line px-4 py-3" />
                </label>
                <button className="rounded-lg bg-gold px-5 py-3 text-sm text-white md:col-span-2">Save listing</button>
              </form>

              <h3 className="mt-10 text-sm uppercase tracking-[0.16em] text-muted">Bids & payments</h3>
              <div className="mt-4 divide-y divide-line">
                {advertiser.bids.map((bid) => (
                  <div key={bid.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <BidAmount cents={bid.amountCents} className="text-gold" />
                      <p className="text-xs text-muted">
                        {bid.status} · {bid.createdAt.toLocaleString()}
                        {bid.payment?.stripeCheckoutSessionId
                          ? ` · ${bid.payment.stripeCheckoutSessionId}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{bid.payment?.status ?? "—"}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
