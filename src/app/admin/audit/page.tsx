import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Audit log</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line">
        {logs.length === 0 && <p className="p-6 text-sm text-muted">No events yet.</p>}
        {logs.map((log) => (
          <div key={log.id} className="px-5 py-4 text-sm">
            <p>
              {log.action}
              {log.entityType ? ` · ${log.entityType}` : ""}
              {log.entityId ? ` · ${log.entityId}` : ""}
            </p>
            <p className="text-xs text-muted">
              {log.createdAt.toLocaleString()}
              {log.actor?.email ? ` · ${log.actor.email}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
