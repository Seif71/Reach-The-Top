"use client";

import { useState } from "react";
import type { Advertiser } from "@prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function faviconUrl(websiteUrl?: string | null) {
  if (!websiteUrl) return null;
  try {
    const host = new URL(websiteUrl.includes("://") ? websiteUrl : `https://${websiteUrl}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return null;
  }
}

export function LogoMark({
  advertiser,
  size = "lg",
}: {
  advertiser: Pick<Advertiser, "name" | "logoUrl"> & { websiteUrl?: string };
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dim = { sm: "h-10 w-10 text-sm", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-lg", xl: "h-16 w-16 text-xl" }[
    size
  ];
  const src = advertiser.logoUrl || faviconUrl(advertiser.websiteUrl);
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={`${dim} rounded-lg bg-white object-contain p-1 ring-1 ring-line`}
      />
    );
  }

  return (
    <div className={`${dim} flex items-center justify-center rounded-lg bg-soft text-sm font-medium text-muted ring-1 ring-line`}>
      {initials(advertiser.name)}
    </div>
  );
}
