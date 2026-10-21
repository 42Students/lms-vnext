import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { PageLoading } from "@/components/ui/page-loading";
import {StatusBadge} from "@/components/ui/status-badge";
import {safeTpoBrandLogoUrl} from "@/modules/placements/tpo-branding-model";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJourneyItem } from "@/components/placements/learner-placement-journey";
import { LearnerApplicationsBrowse } from "@/components/placements/learner-applications-browse";
import { Suspense } from "react";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
import {ownApplicationInterviewLinks} from "@/modules/placements/learner-application-interview-links-model";
import {ownApplicationAssessmentLinks} from "@/modules/placements/learner-application-assessment-links-model";

export default async function LearnerPlacementApplicationsPage() {
  const context = await getCurrentRequestContext();
  const [rows,roundsRead]=await Promise.all([
    getLearnerPlacementJourney(context),
    readOptionalLearnerPlacementSource(()=>getLearnerPlacementRequestWorkspace(context)),
  ]);
  const rounds = roundsRead.available ? roundsRead.value.rounds : [];
  const interviewLinks=ownApplicationInterviewLinks(
    rounds.map(row=>({
      applicationId:row.applicationId,roundId:row.roundId,roundKind:row.roundKind,
      scheduledAt:row.scheduledAt?.toISOString()??null,
      exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
    })),new Date().toISOString(),
  );

  const assessmentLinks=ownApplicationAssessmentLinks(
    rounds.map(row=>({
      applicationId:row.applicationId,roundId:row.roundId,roundKind:row.roundKind,
      scheduledAt:row.scheduledAt?.toISOString()??null,
      exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
    })),new Date().toISOString(),
  );
  const items: LearnerPlacementJourneyItem[] = rows.map((row) => ({
    applicationId: row.applicationId,
    jobId: row.job.id,
    jobTitle: row.job.title,
    driveStatus: row.job.driveStatus,
    companyName: row.company.name,
    applicationStatus: row.applicationStatus,
    offerStatus: row.offerStatus,
    channel: row.channel,
    staffOptOutUntil:row.staffOptOutUntil,
    mayStaffOptOut:row.mayStaffOptOut,
    submittedAt: row.submittedAt,
    withdrawnAt: row.withdrawnAt,
    screening: row.screening,
    results: row.results.map((result) => ({
      resultId: result.resultId,
       roundId: result.roundId,
      roundSequence: result.roundSequence,
      roundName: result.roundName,
      outcome: result.outcome,
      scorePercent: result.scorePercent,
      candidateMessage: result.candidateMessage,
      appliedAt: result.appliedAt,
    })),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Applications" actions={(
        <Link href="/learn/my-placements/offers" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Review all official offers →
      </Link>
      )} />

      
      {rows.length>0?<section aria-label="Application cards" className="min-w-0 border-y border-border py-3">
       <h2 className="mb-2 text-base font-semibold text-foreground">Your applications at a glance</h2>
       <ul className="m-0 divide-y divide-border p-0">
        {rows.map(row=>{
         const logo=safeTpoBrandLogoUrl(row.company.logoPublicUrl);
         const jobType=row.job.jobTypeLabel||row.job.employmentType;
         const pay=row.job.ctcLpa!==null
           ?String(row.job.ctcLpa)+" LPA"
           :row.job.stipendPerMonthInr!==null
             ?"₹"+Number(row.job.stipendPerMonthInr).toLocaleString("en-IN")+" / month"
             :row.job.minimumAnnualCtcInr!==null
               ?"From ₹"+Number(row.job.minimumAnnualCtcInr).toLocaleString("en-IN")+" annually"
               :null;
         const submitted=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
          timeZone:"Asia/Kolkata"}).format(row.submittedAt)+" IST";
         const optOutDeadline=row.staffOptOutUntil?new Intl.DateTimeFormat("en-IN",{
          dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
         }).format(row.staffOptOutUntil)+" IST":null;
         return <li key={row.applicationId} className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-start">
          {logo?<img src={logo} alt="" width={44} height={44}
            referrerPolicy="no-referrer" className="h-11 w-11 shrink-0 rounded-[var(--lms-control-radius)] border border-border object-contain"/>
            :<span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle text-sm font-semibold text-muted-foreground">
              {row.company.name.slice(0,1).toUpperCase()}
             </span>}
          <div className="min-w-0 flex-1 space-y-1">
           <p className="m-0 break-words text-sm font-semibold text-foreground">{row.job.title}</p>
           <p className="m-0 break-words text-sm text-body">{row.company.name}</p>
           <p className="m-0 text-xs text-muted-foreground">{jobType??"Role type not specified"}{pay?" · "+pay:""} · Applied {submitted}</p>
           <div className="flex flex-wrap gap-2">
            <StatusBadge tone={row.applicationStatus==="WITHDRAWN"?"warning":"info"}>
             {row.applicationStatus.replaceAll("_"," ")}
            </StatusBadge>
            {row.offerStatus?<StatusBadge tone="success">Offer: {row.offerStatus.replaceAll("_"," ")}</StatusBadge>:null}
            {row.job.driveStatus==="CANCELLED"?<StatusBadge tone="warning">Drive cancelled</StatusBadge>:null}
           </div>
           {row.applicationStatus==="SUBMITTED"?<p className="m-0 text-xs text-body">
             {row.withdrawalMode==="SELF"?"Self-withdrawal available":row.withdrawalMode==="REQUEST"?
               "Request withdrawal through the placement cell":"Withdrawal unavailable"}
             {optOutDeadline&&row.channel==="PLACEMENT_CELL"?" · Placement-cell opt-out until "+optOutDeadline:""}
           </p>:null}
          </div>
          <Link href={"/learn/my-placements/applications?applicationId="+encodeURIComponent(row.applicationId)}
           className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
           View application →
          </Link>
         </li>;
        })}
       </ul>
      </section>:null}

      {!roundsRead.available ? <Alert tone="error">
        Interview and assessment shortcuts are temporarily unavailable. Your saved applications remain visible and unchanged.
        <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry round shortcuts</Link>
      </Alert> : null}
      <Suspense fallback={<PageLoading label="Loading application filters" variant="form" count={2} />}>
        <LearnerApplicationsBrowse items={items} interviewLinks={interviewLinks} assessmentLinks={assessmentLinks}
          scheduledRounds={rounds.map(row=>({
            applicationId:row.applicationId,roundId:row.roundId,roundName:row.roundName,
            scheduledAt:(row.exception?.scheduledAt??row.scheduledAt)?.toISOString()??null,
            mode:row.exception?.mode??row.mode??"",venue:row.exception?.venue??row.venue,
            isRescheduled:Boolean(row.exception),booked:row.booked,
          }))}/>
      </Suspense>
    </div>
  );
}
