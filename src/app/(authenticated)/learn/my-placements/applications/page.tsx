import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJourneyItem } from "@/components/placements/learner-placement-journey";
import { LearnerApplicationsBrowse } from "@/components/placements/learner-applications-browse";
import { Suspense } from "react";
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
      <Link href="/learn/my-placements/offers" className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        Review all official offers →
      </Link>
      <Suspense fallback={<p className="text-sm text-body">Loading application filters…</p>}>
        <LearnerApplicationsBrowse items={items} />
      </Suspense>
    </div>
  );
}
