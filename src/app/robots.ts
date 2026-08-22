import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/stripe";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
