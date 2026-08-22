import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/stripe";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  return ["", "/advertise", "/how-it-works", "/terms", "/privacy", "/advertising-policy", "/refund-policy", "/contact"].map(
    (path) => ({
      url: `${base}${path || "/"}`,
      lastModified: new Date(),
    }),
  );
}
