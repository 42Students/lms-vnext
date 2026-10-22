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
      <PageHeader title="Placement cell" description="Your registration, offers, round schedule, requests and college placement rules." />
      <nav aria-label="Placement cell sections" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--lms-canvas-border)] pb-3">
        {([["Registration","#registration"],["Offers","#my-offers"],["Schedule","#schedule"],["Your requests","#requests"],["Notices","#notices"],["Placement rules","#rules"]] as const).map(([label,href])=>
          <a key={href} href={href} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-body hover:border-[var(--lms-primary)] hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{label}</a>)}
      </nav>

      {alertRead.available ? <LearnerPlacementAlerts alerts={alertRead.items} /> : (
        <Alert tone="warning" role="alert">
          Personal placement alerts are temporarily unavailable. Your official offers and requests remain accessible.
          <Link href="/learn/my-placements/placement" className="ml-2 inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
            Retry personal alerts
          </Link>
        </Alert>
      )}
      <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 pt-4 pb-0 md:px-6 md:pt-6">
        <LearnerPlacementRegistration registration={registration}/>
      </div>
      <section className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">Need help with a placement decision?</h2>
        <p className="mt-2 text-sm leading-6 text-body">Use the request actions below for application withdrawal, round rescheduling, offer extensions, registration changes, off-campus offers, corrections, absence disputes or placement after placement. Your placement team owns the final decision.</p>
        <Link href="/learn/my-placements/support" className="mr-4 mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">My support-request history →</Link>
        <Link href="/learn/my-placements/rules?from=cell" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Read placement rules →</Link>
      </section>
      <section id="schedule" aria-labelledby="placement-schedule-heading" className="scroll-mt-24 min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
          <h2 id="placement-schedule-heading" className="text-lg font-semibold text-[var(--lms-heading)]">Your schedule</h2>
          <Link href="/learn/my-placements/schedule" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">View all rounds →</Link>
        </div>
        {!requestRead.available?<p role="status" className="text-sm text-body">Schedule details cannot be verified right now. Open the full schedule to retry.</p>:
        requestWorkspace && requestWorkspace.rounds.length>0?(
          <ol className="divide-y divide-[var(--lms-canvas-border)]">
            {requestWorkspace.rounds.slice(0,4).map(row=><li key={row.roundId+":"+row.applicationId} className="flex min-w-0 flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0"><p className="font-semibold text-foreground">{row.companyName} · {row.roleTitle}</p>
                <p className="mt-1 text-body">{row.roundName} · {row.mode==="VIRTUAL"?"Virtual":"On campus"}</p></div>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={row.exception?.scheduledAt.toISOString()??row.scheduledAt?.toISOString()}>
                {row.exception?.scheduledAt||row.scheduledAt
                  ?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.exception?.scheduledAt??row.scheduledAt!)
                  :"Time to be confirmed"}
              </time>
            </li>)}
          </ol>
        ):<p className="text-sm text-body">No scheduled rounds are recorded in your current placement workspace.</p>}
      </section>
      <section id="notices" aria-labelledby="placement-notices-heading" className="scroll-mt-24 min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
          <h2 id="placement-notices-heading" className="text-lg font-semibold text-[var(--lms-heading)]">Notices and placement alerts</h2>
          <Link href="/learn/my-placements/announcements" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Read all college notices →</Link>
        </div>
        <p className="text-sm leading-6 text-body">College-wide notices are published in Announcements. Personal alerts are separate and may include attendance or placement-status changes.</p>
        {alertRead.available?<p role="status" className="text-sm text-body">{alertRead.items.length} recent personal placement {alertRead.items.length===1?"alert":"alerts"} shown above. This is not a count of official notices.</p>:
          <p role="status" className="text-sm text-body">Personal alert history is temporarily unavailable. Official notices remain accessible.</p>}
        <div className="flex flex-wrap gap-4">
          <Link href="/learn/my-placements/announcements?source=placement-cell" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Placement-cell authored notices →</Link>
          <Link href="/learn/my-placements/notification-preferences" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Notification preferences →</Link>
          <Link href="/learn/my-placements/placement?request=absence-dispute#requests" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Wrongly marked absent? Ask the placement cell →</Link>
        </div>
      </section>
      {!requestRead.available ? <Alert tone="warning" role="alert">Your placement requests are temporarily unavailable. Offers remain viewable, but extension requests are disabled until pending requests can be checked. <Link href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry requests</Link></Alert> : null}
      <section id="requests" className="scroll-mt-24 min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6" aria-labelledby="placement-requests-heading">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
          <h2 id="placement-requests-heading" className="text-lg font-semibold text-[var(--lms-heading)]">Your requests</h2>
          <Link href="/learn/my-placements/support" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Request history →</Link>
        </div>
        <p className="text-sm text-body">All types of placement requests are tracked in My support-request history. Application, round and offer requests appear below alongside the other request form.</p>
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
        snapshotNowIso={new Date().toISOString()} offers={offerRows.map((row) => ({ offerId: row.offer.id, applicationId: row.offer.applicationId, companyName: row.company.name, jobTitle: row.job.title, roleTitle: row.offer.roleTitle, status: row.offer.status as "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN", annualCtcInr: row.offer.annualCtcInr,
          companyLogoUrl:row.company.logoPublicUrl,
          legacyCtcLpa:row.offer.legacyCtcLpa,
          respondedAt:row.offer.respondedAt?.toISOString()??null, joiningDate: row.offer.joiningDate, expiresAt: row.offer.expiresAt?.toISOString() ?? null, issuedAt: row.offer.issuedAt.toISOString(),
        acceptanceChannel:row.offer.acceptanceChannel,
        acceptedDisputableUntil:row.offer.acceptedDisputableUntil?.toISOString()??null, joining: row.joining ? { status: row.joining.status as "PENDING" | "JOINED" | "DID_NOT_JOIN" | "DEFERRED", joiningDate: row.joining.joiningDate, reason: row.joining.reason } : null }))} />}
      <section id="rules" className="scroll-mt-24 min-w-0 space-y-2 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <h2 className="border-b border-[var(--lms-canvas-border)] pb-3 text-lg font-semibold text-[var(--lms-heading)]">Placement rules</h2>
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