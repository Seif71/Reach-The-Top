import { legalMetadata, LegalPage } from "@/components/legal";

export const metadata = legalMetadata(
  "Terms of Service",
  "Terms for using ReachTheTop, a paid advertising placement marketplace.",
);

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="These terms are a starting template. Replace them with a version reviewed by your lawyer before public launch."
    >
      <p>
        ReachTheTop sells advertising placement. By using the site, bidding, or paying, you agree to
        these terms. The platform operator provides a website where businesses can purchase the #1
        featured advertising position through competitive bidding.
      </p>
      <p>
        You represent that you have authority to advertise the business or app you submit, that
        your listing is accurate, and that your content does not infringe others’ rights or violate
        law.
      </p>
      <p>
        Payment is processed by Stripe. We do not store raw card numbers. Successful payment does
        not guarantee traffic, clicks, downloads, sales, or any business outcome. You are buying
        visibility on this site for as long as your bid remains the highest successful bid.
      </p>
      <p>
        We may remove listings that are misleading, unlawful, or harmful. Removing a listing does
        not automatically delete payment records.
      </p>
    </LegalPage>
  );
}
