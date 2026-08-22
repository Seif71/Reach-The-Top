import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatUsd } from "@/lib/money";
import { setAdvertiserStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const advertisers = await prisma.advertiser.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { contactEmail: { contains: q, mode: "insensitive" } },
            { websiteUrl: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      bids: { where: { status: "SUCCEEDED" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Advertisers</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <form className="mt-8">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, URL"
          className="w-full max-w-md rounded-2xl border border-line px-4 py-3"
        />
      </form>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line">
        {advertisers.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <Link href={`/admin/advertisers/${a.id}`} className="text-lg hover:text-gold">
                {a.name}
              </Link>
              <p className="text-xs text-muted">
                {a.status} · {a.category} · {a.contactEmail}
                {a.bids[0] ? ` · last bid ${formatUsd(a.bids[0].amountCents)}` : ""}
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <StatusButton id={a.id} status="APPROVED" label="Approve" />
              <StatusButton id={a.id} status="REJECTED" label="Reject" />
              <StatusButton id={a.id} status="REMOVED" label="Remove" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: "APPROVED" | "REJECTED" | "REMOVED";
  label: string;
}) {
  const action = setAdvertiserStatusAction.bind(null, id, status);
  return (
    <form action={action}>
      <button className="rounded-full border border-line px-3 py-1">{label}</button>
    </form>
  );
}
