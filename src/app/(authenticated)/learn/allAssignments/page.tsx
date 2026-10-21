import { Suspense } from "react";
import Link from "next/link";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerAssignmentOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";

type AssignmentSearchParams = { course?: string | string[] };

function AssignmentsLoading() {
  return (
    <div className="min-w-0 max-w-full space-y-4" aria-busy="true" aria-label="Loading assignments">
      <PageHeader title="All Assignments" description="Loading assignments…" />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        <span className="h-7 w-32 animate-pulse rounded-lg bg-muted" />
        <span className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="rounded-lg border border-border p-4">
            <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-3/5 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LearnerAssignmentsPage({searchParams}:{searchParams:Promise<AssignmentSearchParams>}) {
  return <Suspense fallback={<AssignmentsLoading />}>
    <LearnerAssignmentsContent searchParams={searchParams} />
  </Suspense>;
}

async function LearnerAssignmentsContent({searchParams}:{searchParams:Promise<AssignmentSearchParams>}) {
  const [context,query] = await Promise.all([getCurrentRequestContext(),searchParams]);
  // Learner-only access is enforced by the assessment service. Faculty use
  // their separate teacher workspace; do not expose write actions here.
  let overview: Awaited<ReturnType<typeof getLearnerAssessmentOverview>> | null = null;
  try {
    overview = await getLearnerAssessmentOverview(context, { courseId: query.course });
  } catch (error) {
    // Never turn permission failures or invalid course scopes into a public list.
    if (error instanceof AuthorizationError || error instanceof CoursesServiceError) throw error;
  }
  if (!overview) {
    return (
      <div className="min-w-0 max-w-full space-y-4">
        <PageHeader title="All Assignments" />
        <section role="alert" className="rounded-lg border border-border p-5">
          <h2 className="font-semibold text-foreground">Assignments could not be loaded</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a loading problem, not an empty list. Check your connection and try again.
          </p>
          <Link href="/learn/allAssignments?retry=1" className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-[var(--lms-primary)] px-4 text-sm font-semibold text-white">
            Retry
          </Link>
        </section>
      </div>
    );
  }

  const items: LearnerAssignmentOverviewItem[] =
    overview.assignments.map(
      (assignment) => ({
        kind: "ASSIGNMENT",
        id: assignment.id,
        deliveryId:
          assignment.deliveryId,
        courseId: assignment.courseId,
        courseName:
          assignment.courseName,
        courseCode:
          assignment.courseCode,
        lessonId:
          assignment.lessonId,
        lessonName:
          assignment.lessonName,
        title: assignment.title,
        description:
          assignment.description,
        dueAt:
          assignment.dueAt?.toISOString() ??
          null,
        createdAt:
          assignment.createdAt.toISOString(),
        maxPoints: assignment.maxPoints,
        submissionId:
          assignment.submissionId,
        submissionType:
          assignment.submissionType,
        submissionText:
          assignment.submissionText,
        submissionUrl:
          assignment.submissionUrl,
        // Additional repository/website links and files are loaded inside
        // the authenticated assignment drawer using the persisted submission ID.
        // The first submissionType is not the full multipart history.
        submissionReadUnavailable:false,
        submittedAt:
          assignment.submittedAt?.toISOString() ??
          null,
        gradePublished:
          assignment.gradePublished,
        pointsAwarded:
          assignment.pointsAwarded,
        feedback:
          assignment.feedback,
      }),
    );

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader
        title="All Assignments"
        actions={
          <div className="flex flex-wrap gap-2 text-sm" aria-label="Assignment summary">
            <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
              {items.length} {items.length === 1 ? "Assignment" : "Assignments"}
            </span>
            {items.length > 0 ? (
              <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
                {new Set(items.map(item => item.courseId)).size} {new Set(items.map(item => item.courseId)).size === 1 ? "Course" : "Courses"}
              </span>
            ) : null}
            {items.filter(item => {
              const date = new Date(item.createdAt);
              const now = new Date(overview.snapshotNowMs);
              return date.getUTCFullYear() === now.getUTCFullYear() &&
                date.getUTCMonth() === now.getUTCMonth();
            }).length > 0 ? (
              <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
                {items.filter(item => {
                  const date = new Date(item.createdAt);
                  const now = new Date(overview.snapshotNowMs);
                  return date.getUTCFullYear() === now.getUTCFullYear() &&
                    date.getUTCMonth() === now.getUTCMonth();
                }).length} this month
              </span>
            ) : null}
          </div>
        }
      />
      <LearnerAssessmentOverview
        key={overview.selectedCourseId??"all"}
        initialCourseId={overview.selectedCourseId??""}
        fileUploadsEnabled={assignmentFilesRuntimeEnabled()}
        courses={overview.courses}
        classScope={overview.classScope}
        items={items}
        kind="ASSIGNMENT"
        snapshotNowMs={overview.snapshotNowMs}
      />
    </div>
  );
}
