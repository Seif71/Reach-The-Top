"use client";

import { useEffect } from "react";

export function RefreshOnPending({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [active]);

  return null;
}
