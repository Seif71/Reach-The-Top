import { legalMetadata, LegalPage } from "@/components/legal";

export const metadata = legalMetadata("Privacy Policy", "How ReachTheTop handles personal data.");

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="Describe your actual data practices, processors, and retention before launch."
    >
      <p>
        We collect account details (email, optional name), listing information, and payment
        metadata from Stripe (such as customer and checkout identifiers). We do not store credit
        or debit card numbers, CVV codes, or magnetic stripe data.
      </p>
      <p>
        Data is used to operate the marketplace, prevent fraud, complete refunds, and contact
        advertisers about their bids. Stripe processes payments according to its own privacy
        policy.
      </p>
      <p>
        You may request access or deletion of account data, except where we must retain financial
        records for legal or accounting purposes.
      </p>
    </LegalPage>
  );
}
