import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
import { getOwnLearnerPlacementRulesView } from "@/modules/placements/learner-placement-rules-service";

export default async function LearnerPlacementCellPage({
 searchParams,
}:{searchParams:Promise<{request?:string;applicationId?:string;roundId?:string;offerId?:string}>}) {
  const query=await searchParams;
  const validUuid=(s:string|undefined)=>s&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:"";
  const prefillAbsence=query.request==="absence-dispute";
  const prefillAcceptance=query.request==="acceptance-dispute";
  const context = await getCurrentRequestContext();
  const [offerRows, requestRead, alertRead, registration, rulesRead] = await Promise.all([
    listOwnPlacementOffers(context),
    readOptionalLearnerPlacementSource(()=>getLearnerPlacementRequestWorkspace(context)),
    readOptionalLearnerAlertSource(()=>getOwnLearnerPlacementAlerts(context)),
    getOwnLearnerRegistration(context),
    readOptionalLearnerPlacementSource(() => getOwnLearnerPlacementRulesView(context, {from:"cell"})),
  ]);
  const requestWorkspace=requestRead.value;
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Placement cell" description="Registration, offers, placement schedules, requests, eligibility notices and official updates from your placement team." />
      <nav aria-label="Placement cell sections" className="flex min-w-0 gap-3 overflow-x-auto border-b border-border pb-3 text-sm">
       {[["Registration","#registration"],["Offers","#my-offers"],["Requests","#requests"],["Rules","#rules"],["Notices","#notices"]].map(([label,href])=>
        <a key={href} href={href} className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2">{label}</a>)}
      </nav>

      <section id="notices" aria-label="Recent placement notices" className="scroll-mt-24 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border p-4 md:p-5">
       <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Recent notices and updates</h2>
      {alertRead.available ? <LearnerPlacementAlerts alerts={alertRead.items} /> : (
        <Alert tone="warning" role="alert">
          Personal placement alerts are temporarily unavailable. Your official offers and requests remain accessible.
          <Link href="/learn/my-placements/placement" className="ml-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
            Retry personal alerts
          </Link>
        </Alert>
      )}
      <Link href="/learn/my-placements/announcements" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Read all official college notices</Link>
      </section>
      <section id="registration" aria-label="Placement registration" className="scroll-mt-24 rounded-[var(--lms-canvas-radius)] border border-border p-4 md:p-5">
        <h2 className="mb-3 text-lg font-semibold text-[var(--lms-heading)]">Registration</h2>
        <LearnerPlacementRegistration registration={registration}/>
      </section>
      <section className="border-b border-border pb-4">
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">Need help with a placement decision?</h2>
        <p className="mt-2 text-sm leading-6 text-body">Use the request actions below for application withdrawal, round rescheduling, offer extensions, registration changes, off-campus offers, corrections, absence disputes or placement after placement. Your placement team owns the final decision.</p>
        <Link href="/learn/my-placements/support" className="mr-4 mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">My support-request history →</Link>
        <Link href="/learn/my-placements/rules?from=cell" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Read placement rules →</Link>
      </section>
      <nav aria-label="Placement cell resources" className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link href="/learn/my-placements/announcements" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Read all college notices →</Link>
        <Link href="/learn/my-placements/announcements?source=placement-cell" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Placement-cell authored notices →</Link>
        <Link href="/learn/my-placements/notification-preferences" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Notification preferences →</Link>
      </nav>
      {!requestRead.available ? <Alert tone="warning" role="alert">Your placement requests are temporarily unavailable. Offers remain viewable, but extension requests are disabled until pending requests can be checked. <Link href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry requests</Link></Alert> : null}
      <section id="requests" className="scroll-mt-24 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border p-4 md:p-5" aria-label="Your requests">
       <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Your requests</h2>
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
      <section aria-label="Official placement offers" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border p-4 md:p-5">
      {offerRows.length===0 ? (
        <section aria-labelledby="learner-official-offers-heading" className="border-b border-border pb-6">
          <h2 id="learner-official-offers-heading" className="text-base font-semibold text-[var(--lms-heading)]">Official offers</h2>
          <p className="mt-2 text-sm text-body">{learnerPlacementCellOfferEmptyMessage(offerRows.length)}</p>
          <Link href="/learn/my-placements/applications"
            className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">
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
      </section>
      <section id="rules" className="scroll-mt-24 border-b border-border pb-4">
        <h2 className="font-semibold text-[var(--lms-heading)]">Placement rules</h2>
        {rulesRead.available && rulesRead.value?.policyView ? (
          <div className="mt-3 min-w-0 space-y-2">
            <p className="text-sm leading-6 text-body">{rulesRead.value.policyView.personal}</p>
            <ul className="max-w-3xl list-disc space-y-1 pl-6 text-sm leading-6 text-body">
              {rulesRead.value.policyView.points.map(point => <li key={point}>{point}</li>)}
            </ul>
          </div>
        ) : rulesRead.available ? (
          <p role="status" className="mt-2 text-sm leading-6 text-body">
            The placement cell has not configured a college-wide policy record here yet.
          </p>
        ) : (
          <Alert tone="warning" role="alert">
            Placement rules could not be loaded. Use the full rules page to retry.
          </Alert>
        )}
        <Link href="/learn/my-placements/rules?from=cell" className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline">Read placement rules</Link>
      </section>
    </div>
  );
}