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
      <Link
        href="/teach/courses"
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← My Teaching Courses
      </Link>
      <FacultyCourseWorkspace
        workspace={workspace}
      />
    </div>
  );
}
