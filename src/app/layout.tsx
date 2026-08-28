import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/shell";
import { getSettings } from "@/lib/auction";
import { getAppUrl } from "@/lib/stripe";

const sans = Geist({
  variable: "--font-sans-loaded",
  subsets: ["latin"],
});

const siteUrl = getAppUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ReachTheTop — Own the #1 advertising position",
    template: "%s · ReachTheTop",
  },
  description:
    "Pay any amount to appear on the advertising board. The highest payment holds #1. Paid visibility, not guaranteed results.",
  openGraph: {
    title: "Own the #1 Spot.",
    description: "Get seen. Get clicks. Get ahead. Pay to rank. Pay more to take #1.",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Own the #1 Spot.",
    description: "A competitive advertising board for businesses and apps.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let supportEmail = "hello@example.com";
  try {
    supportEmail = (await getSettings()).supportEmail;
  } catch {
    supportEmail = "hello@example.com";
  }
  return (
    <html lang="en">
      <body className={`${sans.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer supportEmail={supportEmail} />
      </body>
    </html>
  );
}
