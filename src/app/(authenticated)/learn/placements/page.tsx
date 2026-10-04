import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerPlacementJobs,
  type LearnerPlacementJobItem,
} from "@/components/placements/learner-placement-jobs";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";

export default async function LearnerPlacementsPage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) {
    redirect("/dashboard");
  }

  const rows = await listLearnerPlacementJobs(
    context,
  );
  const items: LearnerPlacementJobItem[] =
    rows.map((row) => ({
      job: {
        id: row.job.id,
        title: row.job.title,
        description: row.job.description,
        employmentType: row.job.employmentType,
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
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Placements"
        description="Live opportunities for your college with explainable eligibility and your exact application state."
      />
      <LearnerPlacementJobs items={items} />
    </div>
  );
}
