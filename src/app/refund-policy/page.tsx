import { legalMetadata, LegalPage } from "@/components/legal";

export const metadata = legalMetadata("Refund Policy", "When advertising payments are refunded.");

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="Refunds are handled through Stripe. Card data is never stored in this application."
    >
      <p>
        If you complete checkout but the live #1 bid has already moved higher by the time payment
        is confirmed, your bid does not take the spot and the charge is refunded automatically.
      </p>
      <p>
        If checkout is canceled before payment, nothing is charged. Failed payments do not create a
        winning position.
      </p>
      <p>
        Successful bids that become #1 are purchases of advertising placement for the period you
        hold the spot. They are not canceled merely because another advertiser later bids higher —
        that is the expected end of a placement. Discretionary refunds may be issued by the
        operator in cases of error, duplicate charges, or removed listings, at the operator’s
        reasonable discretion.
      </p>
    </LegalPage>
  );
}
