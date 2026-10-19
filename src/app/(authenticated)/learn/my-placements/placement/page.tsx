import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { LearnerPlacementAlerts } from "@/components/placements/learner-placement-alerts";
import { LearnerPlacementRequests } from "@/components/placements/learner-placement-requests";
import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
import { LearnerPlacementRegistration } from "@/components/placements/learner-placement-registration";
import { getOwnLearnerRegistration } from "@/modules/placements/learner-registration-read-service";
import { listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import {learnerPlacementCellOfferEmptyMessage} from "@/modules/placements/learner-placement-cell-offer-empty-model";

export default async function LearnerPlacementCellPage({
 searchParams,
}:{searchParams:Promise<{request?:string;applicationId?:string;roundId?:string;offerId?:string}>}) {
  const query=await searchParams;
  const validUuid=(s:string|undefined)=>s&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:"";
  const prefillAbsence=query.request==="absence-dispute";
  const prefillAcceptance=query.request==="acceptance-dispute";
  const context = await getCurrentRequestContext();
  const [offerRows, requestRead, alertRead, registration] = await Promise.all([
    listOwnPlacementOffers(context),
    readOptionalLearnerPlacementSource(()=>getLearnerPlacementRequestWorkspace(context)),
    readOptionalLearnerAlertSource(()=>getOwnLearnerPlacementAlerts(context)),
    getOwnLearnerRegistration(context),
  ]);
  const requestWorkspace=requestRead.value;
  return (
    <div className="space-y-7">

      <section id="registration" className="scroll-mt-24" aria-label="Registration">
        <LearnerPlacementRegistration registration={registration}/>
      </section>
      <section className="border-b border-border pb-5">
        <h2 className="m-0 text-base font-semibold text-foreground">Need help with a placement decision?</h2>
        <p className="mt-2 text-sm leading-6 text-body">Use the request actions below for application withdrawal, round rescheduling, offer extensions, registration changes, off-campus offers, corrections, absence disputes or placement after placement. Your placement team owns the final decision.</p>
        <Link href="/learn/my-placements/support" className="mt-3 mr-4 inline-flex text-sm font-semibold text-primary-text">My support-request history →</Link>
        <Link href="/learn/my-placements/rules?from=cell" className="mt-3 inline-flex text-sm font-semibold text-primary-text">Read placement rules →</Link>
      </section>
      <nav aria-label="Placement cell resources" className="flex flex-wrap gap-3">
        <Link href="/learn/my-placements/announcements" className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Read all college notices →</Link>
        <Link href="/learn/my-placements/announcements?source=placement-cell" className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Placement-cell authored notices →</Link>
        <Link href="/learn/my-placements/notification-preferences" className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Notification preferences →</Link>
      </nav>
      {alertRead.available ? <LearnerPlacementAlerts alerts={alertRead.items} /> : (
        <section role="alert" className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
          Personal placement alerts are temporarily unavailable. Your official offers and requests remain accessible.
          <Link href="/learn/my-placements/placement" className="ml-2 font-semibold text-primary-text underline">
            Retry personal alerts
          </Link>
        </section>
      )}
      {!requestRead.available ? <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">Your placement requests are temporarily unavailable. Offers remain viewable, but extension requests are disabled until pending requests can be checked. <Link href="/learn/my-placements/placement" className="font-semibold text-primary-text underline">Retry requests</Link></p> : null}
      {offerRows.length===0 ? (
        <section role="status" className="border-b border-border pb-5">
          <h2 className="text-base font-semibold text-foreground">Official offers</h2>
          <p className="mt-2 text-sm text-body">{learnerPlacementCellOfferEmptyMessage(offerRows.length)}</p>
          <Link href="/learn/my-placements/applications"
            className="mt-3 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">
            Review my applications →
          </Link>
        </section>
      ) : <LearnerPlacementOffers
        extensionsAvailable={requestRead.available}
        extensionRequests={(requestWorkspace?.requests ?? []).map(row=>({
          offerId:row.request.offerId,status:row.request.status,
          requestType:row.request.requestType,
        }))}
        snapshotNowIso={new Date().toISOString()} offers={offerRows.map((row) => ({ offerId: row.offer.id, applicationId: row.offer.applicationId, companyName: row.company.name, jobTitle: row.job.title, roleTitle: row.offer.roleTitle, status: row.offer.status as "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN", annualCtcInr: row.offer.annualCtcInr, joiningDate: row.offer.joiningDate, expiresAt: row.offer.expiresAt?.toISOString() ?? null, issuedAt: row.offer.issuedAt.toISOString(),
        acceptanceChannel:row.offer.acceptanceChannel,
        acceptedDisputableUntil:row.offer.acceptedDisputableUntil?.toISOString()??null, joining: row.joining ? { status: row.joining.status as "PENDING" | "JOINED" | "DID_NOT_JOIN" | "DEFERRED", joiningDate: row.joining.joiningDate, reason: row.joining.reason } : null }))} />}
      <section id="requests" className="scroll-mt-24" aria-label="Your requests">
      {requestWorkspace ? <LearnerPlacementRequests
        requests={requestWorkspace.requests.map((row) => ({ id: row.request.id, requestType: row.request.requestType as "APPLICATION_WITHDRAWAL" | "ROUND_RESCHEDULE" | "OFFER_EXTENSION", status: row.request.status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED", reason: row.request.reason, decisionNote: row.request.decisionNote, requestedAt: row.request.requestedAt.toISOString(), decidedAt: row.request.decidedAt?.toISOString() ?? null, roleTitle: row.roleOption.title, jobTitle: row.job.title, companyName: row.company.name, roundName: row.round?.name ?? null, offerRoleTitle: row.offer?.roleTitle ?? null, effectPayload: (row.request.effectPayload ?? {}) as Record<string, unknown> }))}
        rounds={requestWorkspace.rounds.map((row) => ({ applicationId: row.applicationId, roundId: row.roundId, roundName: row.roundName, sequence: row.sequence, roleTitle: row.roleTitle, companyName: row.companyName, scheduledAt: row.scheduledAt?.toISOString() ?? null, timezone: row.timezone, mode: row.mode, venue: row.venue, meetingUrl: row.meetingUrl, exception: row.exception ? { scheduledAt: row.exception.scheduledAt.toISOString(), timezone: row.exception.timezone, mode: row.exception.mode, venue: row.exception.venue, meetingUrl: row.exception.meetingUrl } : null }))}
        offers={requestWorkspace.offers.map((row) => ({ ...row, expiresAt: row.expiresAt?.toISOString() ?? null }))}
      /> : null}
        <LearnerGeneralRequests
          initialKind={prefillAcceptance?"OFFER_ACCEPTANCE_DISPUTE":prefillAbsence?"ABSENCE_DISPUTE":"OFF_CAMPUS_OFFER"}
          initialApplicationId={prefillAbsence?validUuid(query.applicationId):""}
          initialRoundId={prefillAbsence?validUuid(query.roundId):""}
          initialOfferId={prefillAcceptance?validUuid(query.offerId):""}
        />
      </section>
      <section id="rules" className="scroll-mt-24 border-b border-border pb-5">
        <h2 className="font-semibold text-foreground">Placement rules</h2>
        <Link href="/learn/my-placements/rules?from=cell" className="mt-2 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Read placement rules</Link>
      </section>
    </div>
  );
}