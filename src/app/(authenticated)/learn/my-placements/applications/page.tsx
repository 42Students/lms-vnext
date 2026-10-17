import Link from "next/link";
import {learnerApplicationSavedStatusCounts} from "@/modules/placements/learner-application-saved-counts-model";
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
  const savedCounts = learnerApplicationSavedStatusCounts(rows);
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
    submittedAt: row.submittedAt,
    withdrawnAt: row.withdrawnAt,
    screening: row.screening,
    results: row.results.map((result) => ({
      resultId: result.resultId,
      roundSequence: result.roundSequence,
      roundName: result.roundName,
      outcome: result.outcome,
      scorePercent: result.scorePercent,
      candidateMessage: result.candidateMessage,
      appliedAt: result.appliedAt,
    })),
  }));

  return (
    <div className="space-y-6">

      <section aria-label="Saved application status summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body"><strong>{savedCounts.total}</strong> recorded applications</p>
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body"><strong>{savedCounts.submitted}</strong> still submitted</p>
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body"><strong>{savedCounts.withdrawn}</strong> withdrawn</p>
      </section>
      <p className="text-xs text-muted-foreground">These are saved application records, not screening decisions or hiring outcomes.</p>
      <Link href="/learn/my-placements/offers" className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        Review all official offers →
      </Link>
      {!roundsRead.available ? <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
        Interview and assessment shortcuts are temporarily unavailable. Your saved applications remain visible and unchanged.
        <Link href="/learn/my-placements/applications" className="ml-2 font-semibold text-primary-text underline">Retry round shortcuts</Link>
      </p> : null}
      <Suspense fallback={<p className="text-sm text-body">Loading application filters…</p>}>
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
