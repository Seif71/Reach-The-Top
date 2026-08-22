import { legalMetadata, LegalPage } from "@/components/legal";

export const metadata = legalMetadata(
  "Advertising Terms",
  "What advertisers are purchasing on ReachTheTop.",
);

export default function AdvertisingPolicyPage() {
  return (
    <LegalPage
      title="Advertising Terms"
      description="This is paid advertising placement with competitive bidding — not gambling, and not a performance media buy."
    >
      <p>
        The #1 position is a featured homepage placement that includes your name, description,
        category, logo, and a link to your website or app. Only one advertiser holds that
        placement at a time.
      </p>
      <p>
        Any confirmed payment at or above the opening amount appears in the rankings, ordered by
        amount paid. To become #1 you must pay more than the current #1 amount (or at least the
        opening amount if the spot is vacant).
      </p>
      <p>
        You keep #1 until another advertiser’s higher bid is successfully confirmed. We do not
        promise impressions, click-through rates, rankings, revenue, or conversions.
      </p>
      <p>
        Prohibited content includes illegal products, malware, deceptive claims, and anything that
        impersonates another business. The operator may reject or remove listings.
      </p>
    </LegalPage>
  );
}
