import Link from "next/link";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { AdminCourseDisplayEditor } from "./admin-course-display-editor";
import { courseDisplayRuntimeEnabled } from "@/modules/courses/course-display-readiness";
import { getAdminCourseDisplayContent } from "@/modules/courses/course-display-service";
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
  const displayEnabled =
    courseDisplayRuntimeEnabled();
  const display = displayEnabled
    ? await getAdminCourseDisplayContent(
        context,
        workspace.offering.courseId,
      )
    : null;

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
      <AdminCourseDisplayEditor
        courseId={workspace.offering.courseId}
        enabled={displayEnabled}
        initial={
          display
            ? {
                introductionText:
                  display.introductionText,
                bodyHtml:
                  display.bodyHtml,
                takeaways:
                  display.takeaways,
                thumbnailUrl:
                  display.thumbnailUrl,
                version: display.version,
              }
            : null
        }
      />
      <AdminOfferingLearningOverview
        workspace={workspace}
      />
    </div>
  );
}
