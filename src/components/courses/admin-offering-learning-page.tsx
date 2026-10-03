import Link from "next/link";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import {
  AdminOfferingLearningOverview,
} from "./admin-offering-learning-overview";
import {
  getAdminOfferingLearningWorkspace,
} from "@/modules/courses/admin-offering-learning-workspace";

export async function AdminOfferingLearningPage({
  context,
  offeringId,
  eyebrow,
  backHref,
}: {
  context: RequestContext;
  offeringId: string;
  eyebrow: string;
  backHref: string;
}) {
  const workspace =
    await getAdminOfferingLearningWorkspace(
      context,
      offeringId,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={
          workspace.offering.courseName
        }
        description={
          workspace.offering.courseCode +
          " · " +
          workspace.offering.cohortName +
          " · " +
          workspace.offering
            .academicPeriodName
        }
        actions={
          <Link
            href={backHref}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Back to Courses
          </Link>
        }
      />
      <AdminOfferingLearningOverview
        workspace={workspace}
      />
    </div>
  );
}
