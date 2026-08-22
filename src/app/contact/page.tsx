import type { Metadata } from "next";
import { getSettings } from "@/lib/auction";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the ReachTheTop operator.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-4 leading-7">
        For billing, listing issues, or legal notices, email the platform operator. Replace this
        address with your real support inbox before launch.
      </p>
      <a href={`mailto:${settings.supportEmail}`} className="mt-8 inline-flex text-gold">
        {settings.supportEmail}
      </a>
    </div>
  );
}
