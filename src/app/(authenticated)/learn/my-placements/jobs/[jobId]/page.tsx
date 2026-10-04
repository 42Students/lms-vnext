import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerPlacementJobs,
  type LearnerPlacementJobItem,
} from "@/components/placements/learner-placement-jobs";
import { PageHeader } from "@/components/ui/page-header";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";

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
  };
}

export default async function LearnerPlacementJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const context = await getCurrentRequestContext();
  const rows = (await listLearnerPlacementJobs(context)).filter((row) => row.job.id === jobId);

  if (rows.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={rows[0].company.name}
        title={rows[0].job.title}
        description="Drive details and eligibility."
      />
      <LearnerPlacementJobs items={rows.map(toItem)} />
    </div>
  );
}
