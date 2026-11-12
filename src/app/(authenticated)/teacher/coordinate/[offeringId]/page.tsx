import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminOfferingLearningOverview } from "@/components/courses/admin-offering-learning-overview";
import { Alert } from "@/components/ui/alert";
import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
import { getCoordinatorOfferingWorkspace } from "@/modules/courses/coordinator-workspace";
import { COORDINATOR_BADGE_HINT } from "@/modules/courses/coordinator-copy";
import { CoursesServiceError } from "@/modules/courses/errors";
import { AuthorizationError } from "@/modules/permissions/policy";

export const dynamic = "force-dynamic";

/** A course coordinator's view of the lessons, assignments and quizzes shared by every class of their course. */
export default async function CoordinateCoursePage({
  params,
}: {
  params: Promise<{ offeringId: string }>;
}) {
  const { offeringId } = await params;
  if (!z.string().uuid().safeParse(offeringId).success) notFound();
  const context = await getCurrentRequestContext();
  const workspace = await getCoordinatorOfferingWorkspace(context, offeringId).catch((error: unknown) => {
    if (error instanceof AuthorizationError) return "denied" as const;
    if (error instanceof CoursesServiceError) {
      if (error.code === "OFFERING_NOT_FOUND") return "missing" as const;
      if (error.code === "FACULTY_TEACHING_SCOPE_REQUIRED" || error.code === "LEARNING_ACCESS_DENIED") {
        return "denied" as const;
      }
    }
    return "failed" as const;
  });
  if (workspace === "missing") notFound();
  // Not (or no longer) the coordinator: send them to their own course list rather than showing an error page.
  if (workspace === "denied") redirect("/teacher/courses");
  const back = "/teacher/courses";
  if (workspace === "failed") {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader title="Shared lessons" actions={<PageBackLink href={back} label="Back to My Courses" />} />
        <Alert tone="error" role="alert">
          The shared lessons couldn&apos;t be loaded. Refresh the page to try again.
        </Alert>
      </div>
    );
  }
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title={workspace.offering.courseName}
        description={
          workspace.offering.courseCode + " · " + workspace.offering.cohortName + " · " + workspace.offering.academicPeriodName
        }
        actions={<PageBackLink href={back} label="Back to My Courses" />}
      />
      <Alert tone="info">{COORDINATOR_BADGE_HINT}</Alert>
      <AdminOfferingLearningOverview workspace={workspace} coordinatorView />
    </div>
  );
}
