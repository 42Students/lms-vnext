import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { PageLoading } from "@/components/ui/page-loading";
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
        <Link href="/learn/my-placements/offers" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        Review all official offers →
      </Link>
      )} />

      
      {!roundsRead.available ? <Alert tone="error">
        Interview and assessment shortcuts are temporarily unavailable. Your saved applications remain visible and unchanged.
        <Link href="/learn/my-placements/applications" className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry round shortcuts</Link>
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
