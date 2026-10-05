import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { LearnerPlacementRequests } from "@/components/placements/learner-placement-requests";
import { PageHeader } from "@/components/ui/page-header";
import { listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementCellPage() {
  const context = await getCurrentRequestContext();
  const [offerRows, requestWorkspace] = await Promise.all([listOwnPlacementOffers(context), getLearnerPlacementRequestWorkspace(context)]);
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="My Placements" title="Placement cell" description="Your official offer, request and placement-cell support workspace." />
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">Need help with a placement decision?</h2>
        <p className="mt-2 text-sm leading-6 text-body">Use the request actions below for application withdrawal, round rescheduling or offer-extension requests. Your placement team owns the final decision.</p>
        <Link href="/learn/my-placements/rules" className="mt-3 inline-flex text-sm font-semibold text-primary-text">Read placement rules →</Link>
      </section>
      <LearnerPlacementOffers offers={offerRows.map((row) => ({ offerId: row.offer.id, applicationId: row.offer.applicationId, companyName: row.company.name, jobTitle: row.job.title, roleTitle: row.offer.roleTitle, status: row.offer.status as "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN", annualCtcInr: row.offer.annualCtcInr, joiningDate: row.offer.joiningDate, expiresAt: row.offer.expiresAt?.toISOString() ?? null, issuedAt: row.offer.issuedAt.toISOString(), joining: row.joining ? { status: row.joining.status as "PENDING" | "JOINED" | "DID_NOT_JOIN" | "DEFERRED", joiningDate: row.joining.joiningDate, reason: row.joining.reason } : null }))} />
      <LearnerPlacementRequests
        requests={requestWorkspace.requests.map((row) => ({ id: row.request.id, requestType: row.request.requestType as "APPLICATION_WITHDRAWAL" | "ROUND_RESCHEDULE" | "OFFER_EXTENSION", status: row.request.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED", reason: row.request.reason, decisionNote: row.request.decisionNote, requestedAt: row.request.requestedAt.toISOString(), decidedAt: row.request.decidedAt?.toISOString() ?? null, roleTitle: row.roleOption.title, jobTitle: row.job.title, companyName: row.company.name, roundName: row.round?.name ?? null, offerRoleTitle: row.offer?.roleTitle ?? null, effectPayload: (row.request.effectPayload ?? {}) as Record<string, unknown> }))}
        rounds={requestWorkspace.rounds.map((row) => ({ applicationId: row.applicationId, roundId: row.roundId, roundName: row.roundName, sequence: row.sequence, roleTitle: row.roleTitle, companyName: row.companyName, scheduledAt: row.scheduledAt?.toISOString() ?? null, timezone: row.timezone, mode: row.mode, venue: row.venue, meetingUrl: row.meetingUrl, exception: row.exception ? { scheduledAt: row.exception.scheduledAt.toISOString(), timezone: row.exception.timezone, mode: row.exception.mode, venue: row.exception.venue, meetingUrl: row.exception.meetingUrl } : null }))}
        offers={requestWorkspace.offers.map((row) => ({ ...row, expiresAt: row.expiresAt?.toISOString() ?? null }))}
      />
    </div>
  );
}