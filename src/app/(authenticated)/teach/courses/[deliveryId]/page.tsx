import Link from "next/link";
import { notFound } from "next/navigation";
import { courseSectionDeliveryIdSchema } from "@/modules/courses/validation";
import { hidesFacultyCourseRouteError } from "@/modules/courses/faculty-course-route-errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseWorkspace } from "@/components/courses/faculty-course-workspace";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";
import {
  getFacultyCourseHomeSignals,
} from "@/modules/courses/faculty-course-home-service";
import {
  loadCourseDisplayContentIfReady,
} from "@/modules/courses/course-display-service";

export default async function FacultyCoursePage({
  params,
}: {
  params: Promise<{
    deliveryId: string;
  }>;
}) {
  const context =
    await getCurrentRequestContext();
  const { deliveryId } = await params;
  if (!courseSectionDeliveryIdSchema.safeParse(deliveryId).success) notFound();
  let workspace: Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;
  try {
    workspace = await getFacultyCourseWorkspace(context, deliveryId);
  } catch (error) {
    if (hidesFacultyCourseRouteError(error)) notFound();
    throw error;
  }
  const [homeSignals, display] =
    await Promise.all([
      getFacultyCourseHomeSignals(
        context,
        workspace,
      ),
      loadCourseDisplayContentIfReady(
        workspace.course.courseId,
      ),
    ]);

  return (
    <div className="min-w-0 max-w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teach/courses"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
        >
          ← My Teaching Courses
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/courses/${deliveryId}/students`}
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
          >
            Students
          </Link>
          <Link
            href={`/teacher/courses/${deliveryId}/attendanceDetail`}
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
          >
            Attendance
          </Link>
          <Link
            href={`/teacher/courses/${deliveryId}/discussions`}
            className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
          >
            Discussions
          </Link>
        </div>
      </div>
      <FacultyCourseWorkspace
        workspace={workspace}
        homeSignals={homeSignals}
        display={display}
      />
    </div>
  );
}
