import Link from "next/link";
import { learnerOffersSearchSchema, searchOwnOffers } from "@/modules/placements/learner-offers-search-model";
import { learnerOffersExpiringSoon } from "@/modules/placements/learner-offers-expiring-soon-model";
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
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>;
}) {
  const query = await searchParams;
  const requested = typeof query.status === "string" ? query.status : "all";
  const validView = learnerOfferViewSchema.safeParse(requested);
  const view = validView.success ? validView.data : "all";
  const parsedSearch = learnerOffersSearchSchema.safeParse(query.q ?? "");
  const searchTerm = parsedSearch.success ? parsedSearch.data : "";
  const context = await getCurrentRequestContext();
  const [offers,requests] = await Promise.all([
    getOwnLearnerOfferBrowse(context,view),listOwnPlacementRequests(context),
  ]);
  const visibleOffers = searchOwnOffers(offers.items, searchTerm);
  const snapshotNowIso = new Date().toISOString();
  const expiringSoon = learnerOffersExpiringSoon(offers.items.map(row => ({
    status: row.offer.status, expiresAt: row.offer.expiresAt?.toISOString() ?? null,
  })), Date.parse(snapshotNowIso));

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
      <form method="GET" action="/learn/my-placements/offers" className="flex min-w-0 flex-wrap items-end gap-3">
        {view !== "all" ? <input type="hidden" name="status" value={view} /> : null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-foreground">
          Search my offers
          <input name="q" type="search" maxLength={80} defaultValue={searchTerm}
            placeholder="Employer or role" className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Search</button>
        {searchTerm ? <Link href={view === "all" ? "/learn/my-placements/offers" : "/learn/my-placements/offers?status="+view}
          className="inline-flex min-h-11 items-center text-sm text-primary-text underline">Clear search</Link> : null}
      </form>
      {expiringSoon > 0 && view !== "pending" ? (
        <Link href="/learn/my-placements/offers?status=pending"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Review {expiringSoon} awaiting-response {expiringSoon===1?"offer":"offers"} with a deadline in 24 hours →
        </Link>
      ) : null}
      {expiringSoon > 0 ? (
        <div role="status" className="rounded-xl border border-warning bg-surface p-4 text-sm text-body">
          <strong>{expiringSoon} {expiringSoon === 1 ? "offer" : "offers"} awaiting response</strong> in this view have a recorded expiry within 24 hours. Check the official offer deadline before acting.
        </div>
      ) : null}
      {visibleOffers.length === 0 ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {offers.counts.all === 0 ? "No offers recorded" : searchTerm ? "No matching offers" : "No offers in this view"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {offers.counts.all === 0
              ? "Official offers will appear after the placement team issues them. A round result is not an offer."
              : searchTerm ? "No own persisted offer matches this search. Clear it to restore the full selected status."
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
          offers={visibleOffers.map((row) => ({
            offerId: row.offer.id,
            applicationId: row.offer.applicationId,
            companyName: row.company.name,
            jobTitle: row.job.title,
            roleTitle: row.offer.roleTitle,
            kind: row.offer.kind === "LOI" ? "LOI" as const : "OFFER" as const,
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
