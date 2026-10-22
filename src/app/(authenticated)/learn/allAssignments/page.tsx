import { Suspense } from "react";
import Link from "next/link";
import {notFound} from "next/navigation";
import {learnerAssignmentListPage,learnerAssignmentListHref} from "@/modules/courses/learner-assignment-page-model";
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

type AssignmentSearchParams = { course?: string | string[]; page?:string|string[] };

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
  const page=learnerAssignmentListPage(query.page);
  if(page===null)notFound();
  // Learner-only access is enforced by the assessment service. Faculty use
  // their separate teacher workspace; do not expose write actions here.
  let overview: Awaited<ReturnType<typeof getLearnerAssessmentOverview>> | null = null;
  try {
    overview = await getLearnerAssessmentOverview(context, { courseId: query.course,page,pageSize:20 });
  } catch (error) {
    // Never turn permission failures or invalid course scopes into a public list.
    if (error instanceof AuthorizationError || error instanceof CoursesServiceError) throw error;
  }
  if (!overview) {
    // Keep the same keyed client list mounted on a failed router.refresh().
    // Its last successful rows remain visible but submission is disabled;
    // a first-ever load failure still has a genuine error and Retry state.
    const requestedCourse=typeof query.course==="string"?query.course:"";
    return (
      <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
        <PageHeader title="All Assignments" />
        <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 p-4">
          <p className="font-semibold">Assignments could not be loaded</p>
          <p className="text-sm">This is a loading problem, not an empty list.</p>
          <Link href="/learn/allAssignments?retry=1"
            className="inline-flex items-center rounded-md px-3 py-3 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">
            Retry loading assignments
          </Link>
        </div>
        <LearnerAssessmentOverview
          key={requestedCourse||"all"}
          initialCourseId={requestedCourse}
          fileUploadsEnabled={assignmentFilesRuntimeEnabled()}
          courses={[]}
          items={[]}
          kind="ASSIGNMENT"
          loadError
          snapshotNowMs={Date.now()}
        />
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

  const coursesCount = new Set(items.map(item => item.courseId)).size;
  const totalAssignments=overview.pagination?.totals.assignments??items.length;
  const totalPages=Math.max(1,Math.ceil(totalAssignments/20));
  const thisMonth = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit"});
  const snapshotMonth = thisMonth.format(new Date(overview.snapshotNowMs));
  const createdThisMonth = items.filter(item => thisMonth.format(new Date(item.createdAt)) === snapshotMonth).length;

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader
        title="All Assignments"
        actions={
          <div className="flex flex-wrap gap-2 text-sm" aria-label="Assignment summary">
            <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
              {totalAssignments} {totalAssignments === 1 ? "Assignment" : "Assignments"}
            </span>
            {coursesCount > 0 ? (
              <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
                {coursesCount} {coursesCount === 1 ? "Course" : "Courses"} (this page)
              </span>
            ) : null}
            {createdThisMonth > 0 ? (
              <span className="rounded-lg border border-border px-3 py-1.5 font-medium">
                {createdThisMonth} this month (this page)
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
      <nav aria-label="Assignment list pages" className="flex min-w-0 flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
        <span role="status">Page {page} of {totalPages} · {totalAssignments} matching assignments</span>
        {page>1?<Link href={learnerAssignmentListHref(page-1,overview.selectedCourseId)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous assignments</Link>:null}
        {page<totalPages?<Link href={learnerAssignmentListHref(page+1,overview.selectedCourseId)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next assignments</Link>:null}
      </nav>
      <p className="text-xs text-muted-foreground">Search, state and sort controls apply to the assignments on this page. Choose a course to load its authorized assignments before searching.</p>
    </div>
  );
}
