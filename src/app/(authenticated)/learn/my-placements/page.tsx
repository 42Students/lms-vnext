import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
import {placementTableExists} from "@/modules/placements/staged-tables";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {LearnerPlacementRegistration} from "@/components/placements/learner-placement-registration";
import {getOwnLearnerRegistration} from "@/modules/placements/learner-registration-read-service";
import {getOwnLearnerDebarmentNotice} from "@/modules/placements/learner-own-debarment-service";
import { LearnerPlacementAcademicEvidence } from "@/components/placements/learner-placement-academic-evidence";
import {
  LearnerPlacementJobs,
  type LearnerPlacementJobItem,
} from "@/components/placements/learner-placement-jobs";
import {
  LearnerPlacementJourney,
  type LearnerPlacementJourneyItem,
} from "@/components/placements/learner-placement-journey";
import { LearnerPlacementPreferences } from "@/components/placements/learner-placement-preferences";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { LearnerPlacementsDashboard } from "@/components/placements/learner-placements-dashboard";
import { LearnerPlacementPartialAlert } from "@/components/placements/learner-placement-partial-alert";
import { getOwnLearnerRecentCollegeNotices } from "@/modules/placements/learner-dashboard-college-notices-service";
import {learnerNoticeRelativeDay} from "@/modules/placements/learner-dashboard-college-notices-model";
import { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import {learnerNoticeHref} from "@/modules/placements/learner-notice-deep-link-model";
import { learnerDashboardPartialState, type PlacementDashboardAvailability }
  from "@/modules/placements/learner-dashboard-partial-model";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { LearnerRecentPlacementActivity } from "@/components/placements/learner-recent-placement-activity";
import { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
import {getOwnLearnerPlacementGreeting} from "@/modules/placements/learner-dashboard-greeting-service";
import {learnerPlacementApplicationFunnel} from "@/modules/placements/learner-dashboard-funnel-model";
import { LearnerPlacementRequests } from "@/components/placements/learner-placement-requests";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { LEARNER_PLACEMENTS_HOME_SUBTITLE } from "@/modules/placements/learner-placement-copy-model";
import {getOwnLearnerVerificationStatus} from "@/modules/placements/learner-verification-status-service";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import {learnerPlacementVerificationCue} from "@/modules/placements/learner-verification-cue-model";
import { hasMembershipRole } from "@/modules/identity/context";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";
import { getLearnerPlacementJourneyWithActivity } from "@/modules/placements/learner-recent-placement-activity-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { listOwnPlacementOffers } from "@/modules/placements/offer-service";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ requestRoundId?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestRoundId = typeof query.requestRoundId === "string"
    ? query.requestRoundId
    : null;
  const context =
    await getCurrentRequestContext();
  if (!hasMembershipRole(context,"LEARNER")) {
    redirect(context.membership?"/dashboard":"/");
  }

  // Authorization failures cannot be reduced to a "partially loaded" page.
  const ownMembership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{
    collegeId:ownMembership.collegeId,organizationId:ownMembership.organizationId,
  });
  const [jobsRead,preferencesRead,journeyRead,academicRead,offersRead,requestsRead,registrationRead,debarRead] =
    await Promise.allSettled([
      listLearnerPlacementJobs(context),getCandidatePreferences(context),
      getLearnerPlacementJourneyWithActivity(context),getOwnAcademicEvidence(context),
      listOwnPlacementOffers(context),getLearnerPlacementRequestWorkspace(context),getOwnLearnerRegistration(context),getOwnLearnerDebarmentNotice(context),
    ]);
  // Never turn a post-preflight authorization revocation into a partial read:
  // the entire page must deny access, even when other source calls succeeded.
  for(const outcome of [jobsRead,preferencesRead,journeyRead,academicRead,offersRead,requestsRead,registrationRead,debarRead]){
    if(outcome.status==="rejected" && outcome.reason instanceof AuthorizationError)
      throw outcome.reason;
  }
  const availability:PlacementDashboardAvailability={
    jobs:jobsRead.status==="fulfilled",preferences:preferencesRead.status==="fulfilled",
    journey:journeyRead.status==="fulfilled",academic:academicRead.status==="fulfilled",
    offers:offersRead.status==="fulfilled",rounds:requestsRead.status==="fulfilled",
  };
  const rows=jobsRead.status==="fulfilled"?jobsRead.value:null;
  const preferences=preferencesRead.status==="fulfilled"?preferencesRead.value:null;
  const journeyBundle=journeyRead.status==="fulfilled"?journeyRead.value:null;
  const academicEvidence=academicRead.status==="fulfilled"?academicRead.value:null;
  const offerRows=offersRead.status==="fulfilled"?offersRead.value:null;
  const requestWorkspace=requestsRead.status==="fulfilled"?requestsRead.value:null;
  const journeyRows=journeyBundle?.rows ?? [];
  // An accepted internship or other non-counting job cannot make a learner
  // "placed" in the dashboard, even if the official offer is accepted.
  // Job type eligibility is sourced only from an authorized persisted row.
  const countingAcceptedOffer=offerRows && rows
    ?offerRows.find(offer=>offer.offer.status==="ACCEPTED"&&
      rows.some(row=>row.job.id===offer.job.id&&row.job.countsAsPlaced===true))
    :null;
  const countingOfferKnown=offerRows!==null&&rows!==null;
  const overviewUnavailable=!availability.jobs&&!availability.journey&&
    !availability.offers&&!availability.rounds;

  const items: LearnerPlacementJobItem[] =
    (rows ?? []).map((row) => ({
      job: {
        id: row.job.id,
        title: row.job.title,
        description: row.job.description,
        employmentType:
          row.job.employmentType,
        jobTypeLabel:row.job.jobTypeLabel,
        workMode: row.job.workMode,
        locations: row.job.locations,
        openings: row.job.openings,
        minimumAnnualCtcInr:
          row.job.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          row.job.maximumAnnualCtcInr,
        applicationMode:
          row.job.applicationMode,
        externalApplicationUrl:
          row.job.externalApplicationUrl,
        applicationDeadline:
          row.job.applicationDeadline?.toISOString() ??
          null,
      },
      roleOption: {
        id: row.roleOption.id,
        title: row.roleOption.title,
        employmentType:
          row.roleOption.employmentType,
        workMode: row.roleOption.workMode,
        locations: row.roleOption.locations,
        openings: row.roleOption.openings,
        minimumAnnualCtcInr:
          row.roleOption.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          row.roleOption.maximumAnnualCtcInr,
        isPrimary:
          row.roleOption.isPrimary,
      },
      company: row.company,
      application: row.application
        ? {
            ...row.application,
            submittedAt:
              row.application.submittedAt.toISOString(),
            withdrawnAt:
              row.application.withdrawnAt?.toISOString() ??
              null,
          }
        : null,
      eligibility: row.eligibility,
      deadlinePassed: row.deadlinePassed,
      canApply: row.canApply,
      applicationBlockers: row.applicationBlockers,
    }));

  const journey: LearnerPlacementJourneyItem[] =
    journeyRows.map((row) => ({
      applicationId: row.applicationId,
      jobId: row.job.id,
      jobTitle: row.job.title,
      driveStatus: row.job.driveStatus,
      companyName: row.company.name,
      applicationStatus:
        row.applicationStatus,
      channel: row.channel,
      submittedAt: row.submittedAt,
      withdrawnAt: row.withdrawnAt,
      screening: row.screening,
      results: row.results.map(
        (result) => ({
          resultId: result.resultId,
          roundSequence:
            result.roundSequence,
          roundName: result.roundName,
          outcome: result.outcome,
          scorePercent:
            result.scorePercent,
          candidateMessage:
            result.candidateMessage,
          appliedAt: result.appliedAt,
        }),
      ),
    }));

  const dashboard = learnerPlacementDashboard({
    registrationRequired:registrationRead.status==="fulfilled"&&
      registrationRead.value.stage==="OPEN"&&!registrationRead.value.hasRegistration,
    optedOut:registrationRead.status==="fulfilled"&&
      ["HIGHER_STUDIES","NOT_INTERESTED"].includes(registrationRead.value.choice??""),
    placed:Boolean(countingAcceptedOffer),
    pendingRescheduleRoundIds:(requestWorkspace?.requests??[])
      .filter(row=>row.request.requestType==="ROUND_RESCHEDULE"&&
        row.request.status==="PENDING"&&row.request.roundId!==null)
      .map(row=>row.request.roundId!),
    jobs: (rows ?? []).map((row) => ({
      jobId: row.job.id,
      deadlinePassed: row.deadlinePassed,
      canApply: row.canApply,
    })),
    applications: journeyRows.map((row) => ({
      applicationId: row.applicationId,
      applicationStatus: row.applicationStatus,
      screeningStatus: row.screening.status,
    })),
    rounds: (requestWorkspace?.rounds ?? []).map((row) => ({
      applicationId: row.applicationId,
      roundId: row.roundId,
      roundKind: row.roundKind,
      roundName: row.roundName,
      companyName: row.companyName,
      roleTitle: row.roleTitle,
      scheduledAt: row.scheduledAt,
      exception: row.exception
        ? { scheduledAt: row.exception.scheduledAt }
        : null,
    })),
    offers: (offerRows ?? []).map((row) => ({
      status: row.offer.status,
      expiresAt: row.offer.expiresAt,
    })),
  });

  const display=learnerDashboardPartialState(availability,dashboard);
  const applicationFunnel=journeyBundle ? learnerPlacementApplicationFunnel(journeyRows) : null;
  let collegeNotices:Awaited<ReturnType<typeof getOwnLearnerRecentCollegeNotices>>=null;
  let collegeNoticesFailed=false;
  try {
    collegeNotices=await getOwnLearnerRecentCollegeNotices(context);
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    collegeNoticesFailed=true;
  }
  const personalNoticeRead=await readOptionalLearnerPlacementSource(
   ()=>getOwnLearnerPlacementAlerts(context,{limit:3}));
  const verificationRead=await readOptionalLearnerPlacementSource(
    ()=>getOwnLearnerVerificationStatus(context));
  const verificationCue=verificationRead.available
    ? learnerPlacementVerificationCue(verificationRead.value.education.status,verificationRead.value.identity.status)
    : null;
  const learnerName=await getOwnLearnerPlacementGreeting(context).catch(error=>{
    if(error instanceof AuthorizationError)throw error;
    return null;
  });

  // Legacy first viewport: up to four live applications, with the original
  // round snapshot and links to the UUID-scoped application detail, not an
  // inferred selected/placed outcome.
  const liveApplications=journey.filter(row=>
   row.applicationStatus==="SUBMITTED" ||
   offerRows?.some(offer=>offer.offer.applicationId===row.applicationId&&
     offer.offer.status==="ISSUED")).slice(0,4);
  const money=Number(countingAcceptedOffer?.offer.annualCtcInr??0);
  const acceptedLpa=money>0&&Number.isFinite(money)
    ?(Math.round(money/10000)/10).toFixed(1):null;
  const dateFormatter=new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
  });
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="My Placements"
        description={LEARNER_PLACEMENTS_HOME_SUBTITLE}
      />

      <Tabs ariaLabel="Placements sections" renderPanel={false}
        value="/learn/my-placements" items={[
         {value:"/learn/my-placements",label:"Home",href:"/learn/my-placements"},
         {value:"/learn/my-placements/jobs",label:"Jobs",href:"/learn/my-placements/jobs"},
         {value:"/learn/my-placements/applications",label:"Applications",href:"/learn/my-placements/applications"},
         {value:"/learn/my-placements/calendar",label:"Schedule",href:"/learn/my-placements/calendar"},
         {value:"/learn/my-placements/offers",label:"Offers",href:"/learn/my-placements/offers"},
         {value:"/learn/my-placements/announcements",label:"Announcements",href:"/learn/my-placements/announcements"},
         {value:"/learn/my-placements/rules",label:"Placements",href:"/learn/my-placements/rules"},
        ]}/>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href="/learn/my-placements/preparation"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Placement preparation checklist →
        </Link>
        <Link href="/learn/my-placements/notification-preferences"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Placement notification choices →
        </Link>
      </div>

      {debarRead.status==="fulfilled"&&debarRead.value?<Alert tone="warning" role="alert">
        <h2 className="font-semibold text-foreground">You are barred from drives for now</h2>
        <p className="mt-2 text-sm text-body">
          The placement cell has recorded a temporary participation restriction.
          {debarRead.value.untilDate?" Until "+debarRead.value.untilDate+" (college local date).":""}
          {debarRead.value.remainingDrives!==null?" "+debarRead.value.remainingDrives+" drive(s) remain in the recorded count.":""}
        </p>
        <Link href="/learn/my-placements/support" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline">
          Think this is wrong? Tell the placement cell
        </Link>
      </Alert>:null}
      <LearnerPlacementsDashboard snapshot={dashboard} availability={availability} learnerName={learnerName} applicationFunnel={applicationFunnel} registration={registrationRead.status==="fulfilled"?registrationRead.value:null}
        profileFixes={verificationCue?.editHrefs??[]} acceptedOffer={countingOfferKnown?Boolean(countingAcceptedOffer):null} />
      <section id="learner-next-seven-days" aria-labelledby="learner-next-seven-days-title"
        className="min-w-0 border-b border-border py-4">
       <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="learner-next-seven-days-title" className="text-lg font-semibold text-heading">Next 7 days</h2>
        <Link href="/learn/my-placements/calendar" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Full schedule →</Link>
       </div>
       {!availability.rounds?<p role="status" className="mt-3 text-sm text-body">Upcoming events are temporarily unavailable. No empty schedule is assumed.</p>:
        dashboard.weekEvents.length?<ul className="mt-3 divide-y divide-border">
         {dashboard.weekEvents.slice(0,7).map(event=><li key={event.applicationId+":"+event.roundId} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><p className="font-semibold">{event.roundName} · {event.companyName}</p>
           <p className="text-xs text-body">{event.roleTitle} · {dateFormatter.format(event.when)} IST</p></div>
          <Link href={event.href} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">View event →</Link>
         </li>)}
        </ul>:<p className="mt-3 text-sm text-body">No scheduled events recorded for the next seven days.</p>}
      </section>
      <section id="learner-application-progress" aria-labelledby="learner-application-progress-title"
       className="min-w-0 border-b border-border py-4">
       <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="learner-application-progress-title" className="text-lg font-semibold text-heading">Where your applications stand</h2>
        <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">All applications →</Link>
       </div>
       {!availability.journey?<p role="status" className="mt-3 text-sm text-body">Application journeys could not be loaded. No progress has been inferred.</p>:
        liveApplications.length?<ul className="mt-3 divide-y divide-border">
         {liveApplications.map(item=><li key={item.applicationId} className="flex min-w-0 flex-wrap items-center gap-3 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-subtle text-sm font-bold text-primary-text">
           {item.companyName.trim().charAt(0).toUpperCase()||"C"}
          </span>
          <div className="min-w-0 flex-1">
           <p className="font-semibold text-heading">{item.companyName} · {item.jobTitle}</p>
           <p className="text-xs text-body">Application: {item.applicationStatus.replaceAll("_"," ")}
            {" · "}{item.results.length?item.results[item.results.length-1]!.roundName:"Awaiting next round"}</p>
           {item.results.length?<p className="mt-1 text-xs text-muted-foreground">
            {item.results.map(round=>round.roundName+": "+round.outcome).join(" → ")}
           </p>:null}
          </div>
          <Link href={"/learn/my-placements/applications?applicationId="+encodeURIComponent(item.applicationId)}
           className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Open →</Link>
         </li>)}
        </ul>:<p className="mt-3 text-sm text-body">No ongoing applications.</p>}
      </section>
      <section aria-labelledby="learner-college-notice-preview" className="min-w-0 border-b border-border py-4 md:py-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 id="learner-college-notice-preview" className="text-base font-semibold text-foreground">Latest from the placement cell</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn/my-placements/announcements"
              className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">View all visible notices →</Link>
            <Link href="/learn/my-placements/announcements?source=placement-cell"
              className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">From placement cell →</Link>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">These are notices visible to your college membership, not necessarily placement-cell announcements.</p>
        {collegeNoticesFailed ? <Alert tone="error" className="mt-3">College notices are temporarily unavailable. Your other placement information is unchanged.</Alert>
          : collegeNotices===null ? <p className="mt-3 text-sm text-body">The college notice feed is not enabled.</p>
          : collegeNotices.length===0 ? <p className="mt-3 text-sm text-body">No notices yet.</p>
          : <ul className="mt-3 space-y-2">{collegeNotices.map(notice=><li key={notice.id} className="min-w-0 border-b border-border py-3 last:border-b-0">
              {learnerNoticeHref(notice.id) ? (
                <Link href={learnerNoticeHref(notice.id)!} className="inline-flex min-h-11 md:min-h-9 items-center break-words text-sm font-semibold text-primary-text underline">
                  {notice.title} →
                </Link>
              ) : <p className="break-words text-sm font-semibold text-foreground">{notice.title}</p>}
              <p className="mt-1 line-clamp-2 text-sm text-body">{notice.message}</p>
              <time dateTime={notice.createdAt} className="text-xs text-muted-foreground">{learnerNoticeRelativeDay(notice.createdAt,new Date())}</time>
            </li>)}</ul>}
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Latest personal updates</h3>
          {!personalNoticeRead.available ? (
            <Alert tone="info" className="mt-2">Personal placement updates are temporarily unavailable. College notices above remain visible.</Alert>
          ) : personalNoticeRead.value.length===0 ? (
            <p className="mt-2 text-sm text-body">No personal placement updates have been delivered yet.</p>
          ) : <ul className="mt-3 space-y-2">
            {personalNoticeRead.value.map(alert=>(
              <li key={alert.id} className="min-w-0 border-b border-border py-3 text-sm text-body last:border-b-0">
                <p className="font-semibold text-foreground">{alert.title}{alert.unread?" · Unread":""}</p>
                <p className="mt-1 line-clamp-2">{alert.body}</p>
                 <time className="mt-1 block text-xs text-muted-foreground" dateTime={alert.createdAt.toISOString()}>{learnerNoticeRelativeDay(alert.createdAt,new Date())}</time>
                {alert.actionHref?<Link href={alert.actionHref} className="mt-2 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline">Open update →</Link>:null}
              </li>
            ))}
          </ul>}
          <Link href="/learn/my-placements/announcements#personal-updates"
            className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">See all personal updates →</Link>
        </div>
      </section>
      {registrationRead.status==="fulfilled"?<LearnerPlacementRegistration registration={registrationRead.value}/>:(
        <Alert tone="warning" role="alert" aria-label="Placement registration">
          <h2 className="font-semibold text-foreground">Registration</h2>
          <p className="mt-2 text-sm text-body">Your batch registration status is temporarily unavailable. No registration choice has been assumed.</p>
          <Link href="/learn/my-placements" className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-primary-text underline">Retry registration</Link>
        </Alert>
      )}
      {overviewUnavailable ? <Alert tone="error" role="alert">
        <h2 className="font-semibold text-foreground">We could not load your placements</h2>
        <p className="mt-2 text-sm text-body">
          Your placement results have not been changed. Some account and registration
          information may still be visible, but your journey and schedule could not be verified.
        </p>
        <Link href="/learn/my-placements" className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Retry
        </Link>
      </Alert> : null}
      {!availability.rounds || !availability.journey ? <Alert tone="warning" role="status">
        {availability.rounds
          ?"Your schedule and application history could not both be checked. Missing timeline entries are unknown, not proof of no events."
          :"Your scheduled placement rounds could not be loaded. No upcoming event count has been assumed."}
        <Link href="/learn/my-placements" className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Retry
        </Link>
      </Alert> : null}
      <LearnerPlacementPartialAlert missing={display.failed} />
      {countingAcceptedOffer ? <Alert tone="info" role="status">
        <p className="font-semibold text-foreground">
          You're placed with {countingAcceptedOffer.company.name}
        </p>
        <p className="mt-2 text-sm text-body">
          {acceptedLpa?"₹"+acceptedLpa+" LPA · ":""}
          This accepted offer is recorded as counting toward placement. You may
          still be eligible for other drives under your college's policy and each drive's eligibility rules.
        </p>
        <Link href="/learn/my-placements/jobs" className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Browse other eligible drives →
        </Link>
      </Alert> : null}



      <section aria-labelledby="learner-placement-verification"
        className="min-w-0 border-b border-border py-4 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="learner-placement-verification" className="text-base font-semibold text-foreground">Profile verification</h2>
          <Link href="/learn/profile/verification" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline">
            Review education and identity verification →
          </Link>
        </div>
        <p className="mt-2 text-sm text-body">
          {verificationCue ? verificationCue.summary :
            "Your current verification status is temporarily unavailable. Open your profile to retry."}
        </p>
        {verificationCue && verificationCue.editHrefs.length>0 ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {verificationCue.editHrefs.map(link=>(
              <Link key={link.href} href={link.href}
                className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">
                {link.label} →
              </Link>
            ))}
          </div>
        ) : null}
        {verificationCue ? <p className="mt-2 text-xs text-muted-foreground">
          Education: {verificationCue.educationLabel} · Identity: {verificationCue.identityLabel}.
          This is profile review status, not a placement eligibility decision.
        </p> : null}
      </section>
      {journeyBundle ? <LearnerRecentPlacementActivity events={journeyBundle.activity} /> : null}

      {offerRows ? <LearnerPlacementOffers
        snapshotNowIso={new Date().toISOString()}
        offers={offerRows.map((row) => ({
          offerId: row.offer.id,
          applicationId:
            row.offer.applicationId,
          companyName:
            row.company.name,
          jobTitle: row.job.title,
          roleTitle:
            row.offer.roleTitle,
          status:
            row.offer.status as
              | "ISSUED"
              | "ACCEPTED"
              | "DECLINED"
              | "WITHDRAWN",
          annualCtcInr:
            row.offer.annualCtcInr,
          companyLogoUrl:row.company.logoPublicUrl,
          legacyCtcLpa:row.offer.legacyCtcLpa,
          respondedAt:row.offer.respondedAt?.toISOString()??null,
          joiningDate:
            row.offer.joiningDate,
          expiresAt:
            row.offer.expiresAt?.toISOString() ??
            null,
          issuedAt:
            row.offer.issuedAt.toISOString(),
          joining: row.joining
            ? {
                status:
                  row.joining.status as
                    | "PENDING"
                    | "JOINED"
                    | "DID_NOT_JOIN"
                    | "DEFERRED",
                joiningDate:
                  row.joining.joiningDate,
                reason:
                  row.joining.reason,
              }
            : null,
        }))}
      /> : null}

      {requestWorkspace ? <LearnerPlacementRequests
        initialRoundId={requestRoundId}
        requests={requestWorkspace.requests.map(
          (row) => ({
            id: row.request.id,
            requestType:
              row.request.requestType as
                | "APPLICATION_WITHDRAWAL"
                | "ROUND_RESCHEDULE"
                | "OFFER_EXTENSION",
            status:
              row.request.status as
                | "PENDING"
                | "APPROVED"
                | "REJECTED"
                | "CANCELLED",
            reason: row.request.reason,
            decisionNote:
              row.request.decisionNote,
            requestedAt:
              row.request.requestedAt.toISOString(),
            decidedAt:
              row.request.decidedAt?.toISOString() ??
              null,
            roleTitle:
              row.roleOption.title,
            jobTitle: row.job.title,
            companyName: row.company.name,
            roundName:
              row.round?.name ?? null,
            offerRoleTitle:
              row.offer?.roleTitle ?? null,
            effectPayload:
              (row.request.effectPayload ??
                {}) as Record<
                string,
                unknown
              >,
          }),
        )}
        rounds={requestWorkspace.rounds.map(
          (row) => ({
            applicationId:
              row.applicationId,
            roundId: row.roundId,
            roundName: row.roundName,
            sequence: row.sequence,
            roleTitle: row.roleTitle,
            companyName:
              row.companyName,
            scheduledAt:
              row.scheduledAt?.toISOString() ??
              null,
            timezone: row.timezone,
            mode: row.mode,
            venue: row.venue,
            meetingUrl: row.meetingUrl,
            exception: row.exception
              ? {
                  scheduledAt:
                    row.exception.scheduledAt.toISOString(),
                  timezone:
                    row.exception.timezone,
                  mode:
                    row.exception.mode,
                  venue:
                    row.exception.venue,
                  meetingUrl:
                    row.exception.meetingUrl,
                }
              : null,
          }),
        )}
        offers={requestWorkspace.offers.map(
          (row) => ({
            ...row,
            expiresAt:
              row.expiresAt?.toISOString() ??
              null,
          }),
        )}
      /> : null}

      {journeyBundle ? <LearnerPlacementJourney items={journey} /> : null}

      {availability.academic ? <LearnerPlacementAcademicEvidence
        evidence={{
          cgpa:
            academicEvidence?.cgpa ?? null,
          activeBacklogs:
            academicEvidence?.activeBacklogs ??
            null,
          pastBacklogs:
            academicEvidence?.pastBacklogs ??
            null,
          tenthPercentage:
            academicEvidence?.tenthPercentage ??
            null,
          twelfthPercentage:
            academicEvidence?.twelfthPercentage ??
            null,
          diplomaPercentage:
            academicEvidence?.diplomaPercentage ??
            null,
          undergraduatePercentage:
            academicEvidence?.undergraduatePercentage ??
            null,
          gapYears:
            academicEvidence?.gapYears ?? null,
          isLateralEntry:
            academicEvidence?.isLateralEntry ??
            false,
          passingYear:
            academicEvidence?.passingYear ?? null,
          source:
            (academicEvidence?.source as
              | "SELF"
              | "VERIFIED"
              | undefined) ?? null,
        }}
      /> : null}

      {preferences ? <LearnerPlacementPreferences
        preferences={{
          preferredRoleTitles:
            preferences.preferredRoleTitles,
          preferredLocations:
            preferences.preferredLocations,
          preferredEmploymentTypes:
            preferences.preferredEmploymentTypes,
          preferredWorkMode:
            preferences.preferredWorkMode,
          shiftPreference:
            preferences.shiftPreference,
          minimumAnnualCtcInr:
            preferences.minimumAnnualCtcInr,
          relocationPreference:
            preferences.relocationPreference,
          notifyMatchingJobs:
            preferences.notifyMatchingJobs,
          notifyApplicationUpdates:
            preferences.notifyApplicationUpdates,
        }}
      /> : null}

      {(await placementTableExists("placement_learner_general_requests"))?<LearnerGeneralRequests/>:null}

      {rows ? <section aria-label="Live placement opportunities" className="space-y-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Live opportunities
          </h2>
          <p className="mt-1 text-sm text-body">
            Published jobs for your college with explainable eligibility and exact application state.
          </p>
        </div>
        <LearnerPlacementJobs items={items} />
      </section> : null}
    </div>
  );
}
