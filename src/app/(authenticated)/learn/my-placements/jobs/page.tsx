import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";
import { LearnerJobsBrowse } from "@/components/placements/learner-jobs-browse";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerDriveBrowse } from "@/modules/placements/learner-closing-drives-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {listOwnPlacementSavedJobs} from "@/modules/placements/saved-job-service";

function toItem(row: Awaited<ReturnType<typeof listLearnerPlacementJobs>>[number]): LearnerPlacementJobItem {
  return {
    job: {
      id: row.job.id,
      title: row.job.title,
      description: row.job.description,
      employmentType: row.job.employmentType,
      workMode: row.job.workMode,
      locations: row.job.locations,
      openings: row.job.openings,
      minimumAnnualCtcInr: row.job.minimumAnnualCtcInr,
      maximumAnnualCtcInr: row.job.maximumAnnualCtcInr,
      applicationMode: row.job.applicationMode,
      externalApplicationUrl: row.job.externalApplicationUrl,
      applicationDeadline: row.job.applicationDeadline?.toISOString() ?? null,
      publishedAt: row.job.publishedAt?.toISOString() ?? null,
      stipendPerMonthInr:row.job.stipendPerMonthInr,
    },
    roleOption: {
      id: row.roleOption.id,
      title: row.roleOption.title,
      employmentType: row.roleOption.employmentType,
      workMode: row.roleOption.workMode,
      locations: row.roleOption.locations,
      openings: row.roleOption.openings,
      minimumAnnualCtcInr: row.roleOption.minimumAnnualCtcInr,
      maximumAnnualCtcInr: row.roleOption.maximumAnnualCtcInr,
      isPrimary: row.roleOption.isPrimary,
      fixedLpa:row.roleOption.fixedLpa,
      variableLpa:row.roleOption.variableLpa,
      joiningBonusLpa:row.roleOption.joiningBonusLpa,
    },
    company: row.company,
    application: row.application
      ? {
          ...row.application,
          submittedAt: row.application.submittedAt.toISOString(),
          withdrawnAt: row.application.withdrawnAt?.toISOString() ?? null,
        }
      : null,
    eligibility: row.eligibility,
    deadlinePassed: row.deadlinePassed,
    canApply: row.canApply,
    applicationBlockers: row.applicationBlockers,
  };
}

export default async function LearnerPlacementJobsPage() {
  const context = await getCurrentRequestContext();
  const [{ rows, snapshotNowIso },savedJobs] = await Promise.all([
    getOwnLearnerDriveBrowse(context),listOwnPlacementSavedJobs(context),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Placements"
        title="Drives"
        description="Placement drives and roles available to you."
      />
      <Link href="/learn/my-placements/rules?from=drives"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
        Review placement rules and preparation →
      </Link>
      <Suspense fallback={<p className="text-sm text-body">Loading drive filters…</p>}>
        <LearnerJobsBrowse items={rows.map(toItem)} snapshotNowIso={snapshotNowIso}
          savedJobIds={savedJobs.map(job=>job.jobId)} />
      </Suspense>
    </div>
  );
}
