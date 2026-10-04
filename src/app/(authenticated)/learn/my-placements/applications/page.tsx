import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerPlacementJourney,
  type LearnerPlacementJourneyItem,
} from "@/components/placements/learner-placement-journey";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";

export default async function LearnerPlacementApplicationsPage() {
  const context = await getCurrentRequestContext();
  const rows = await getLearnerPlacementJourney(context);

  const items: LearnerPlacementJourneyItem[] = rows.map((row) => ({
    applicationId: row.applicationId,
    jobTitle: row.job.title,
    companyName: row.company.name,
    applicationStatus: row.applicationStatus,
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
      <PageHeader
        eyebrow="My Placements"
        title="Applications"
        description="Your placement applications and their current journey."
      />
      <LearnerPlacementJourney items={items} />
    </div>
  );
}
