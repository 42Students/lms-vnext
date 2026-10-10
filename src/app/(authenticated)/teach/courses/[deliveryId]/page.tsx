import Link from "next/link";
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
  const workspace =
    await getFacultyCourseWorkspace(
      context,
      deliveryId,
    );
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teach/courses"
          className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          ← My Teaching Courses
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/courses/${deliveryId}/students`}
            className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
          >
            Students
          </Link>
          <Link
            href={`/teacher/courses/${deliveryId}/attendanceDetail`}
            className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
          >
            Attendance
          </Link>
          <Link
            href={`/teacher/courses/${deliveryId}/discussions`}
            className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
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
