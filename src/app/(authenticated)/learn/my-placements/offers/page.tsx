import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerOfferBrowse } from "@/modules/placements/learner-offers-browse-service";
import {listOwnPlacementRequests} from "@/modules/placements/request-service";
import {
  learnerOfferViewSchema,
  type LearnerOfferView,
} from "@/modules/placements/learner-offers-browse-model";

const tabs: readonly { id: LearnerOfferView; label: string }[] = [
  { id: "all", label: "All offers" },
  { id: "pending", label: "Awaiting response" },
  { id: "accepted", label: "Accepted" },
  { id: "closed", label: "Declined / withdrawn" },
];

export default async function LearnerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const query = await searchParams;
  const requested = typeof query.status === "string" ? query.status : "all";
  const validView = learnerOfferViewSchema.safeParse(requested);
  const view = validView.success ? validView.data : "all";
  const context = await getCurrentRequestContext();
  const [offers,requests] = await Promise.all([
    getOwnLearnerOfferBrowse(context,view),listOwnPlacementRequests(context),
  ]);
  const snapshotNowIso = new Date().toISOString();

  return (
    <div className="space-y-6">
      <Link
        href="/learn/my-placements/applications"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Applications
      </Link>
      <PageHeader
        eyebrow="My Placements"
        title="My offers"
        description="Official persisted offers, current response status and recorded joining outcomes."
      />
      <nav aria-label="Offer status" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "all" ? "/learn/my-placements/offers" :
              "/learn/my-placements/offers?status=" + tab.id}
            aria-current={view === tab.id ? "page" : undefined}
            className={view === tab.id
              ? "inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
              : "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-body hover:bg-primary-subtle"}
          >
            {tab.label} ({offers.counts[tab.id]})
          </Link>
        ))}
      </nav>
      {offers.items.length === 0 ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {offers.counts.all === 0 ? "No offers recorded" : "No offers in this view"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {offers.counts.all === 0
              ? "Official offers will appear after the placement team issues them. A round result is not an offer."
              : "No persisted offer currently matches this status. Choose another status to see other offers."}
          </p>
          {offers.counts.all > 0 ? (
            <Link href="/learn/my-placements/offers"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
              See all offers →
            </Link>
          ) : null}
        </section>
      ) : (
        <LearnerPlacementOffers
          extensionRequests={requests.map(row=>({
            offerId:row.request.offerId,status:row.request.status,
            requestType:row.request.requestType,
          }))}
          snapshotNowIso={snapshotNowIso}
          offers={offers.items.map((row) => ({
            offerId: row.offer.id,
            applicationId: row.offer.applicationId,
            companyName: row.company.name,
            jobTitle: row.job.title,
            roleTitle: row.offer.roleTitle,
            status: row.offer.status as "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN",
            annualCtcInr: row.offer.annualCtcInr,
            joiningDate: row.offer.joiningDate,
            expiresAt: row.offer.expiresAt?.toISOString() ?? null,
            issuedAt: row.offer.issuedAt.toISOString(),
            joining: row.joining
              ? {
                  status: row.joining.status as
                    "PENDING" | "JOINED" | "DID_NOT_JOIN" | "DEFERRED",
                  joiningDate: row.joining.joiningDate,
                  reason: row.joining.reason,
                }
              : null,
          }))}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Offer actions reuse the existing authorized offer-response endpoint.
        This page does not issue an offer or infer joining from acceptance.
      </p>
    </div>
  );
}
