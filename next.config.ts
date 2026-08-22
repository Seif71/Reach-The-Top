import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "www.google.com" }],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
