import Link from "next/link";

const links = [
  ["/admin", "Overview"],
  ["/admin/advertisers", "Advertisers"],
  ["/admin/payments", "Payments"],
  ["/admin/history", "Bid history"],
  ["/admin/settings", "Settings"],
  ["/admin/audit", "Audit log"],
];

export function AdminNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink">
          {label}
        </Link>
      ))}
    </div>
  );
}
