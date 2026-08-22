import type { Advertiser } from "@prisma/client";
import { formatUsd } from "@/lib/money";

export function formatHost(url: string) {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BidAmount({ cents, className = "" }: { cents: number; className?: string }) {
  return <span className={`tabular-nums ${className}`}>{formatUsd(cents)}</span>;
}

export { LogoMark } from "@/components/site-icon";
