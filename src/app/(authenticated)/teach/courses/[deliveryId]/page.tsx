import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseWorkspace } from "@/components/courses/faculty-course-workspace";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teach/courses"
          className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          ← My Teaching Courses
        </Link>
        <Link
          href={`/teacher/courses/${deliveryId}/attendanceDetail`}
          className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
        >
          Attendance
        </Link>
      </div>
      <FacultyCourseWorkspace
        workspace={workspace}
      />
    </div>
  );
}
