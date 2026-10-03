import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseWorkspace } from "@/components/courses/learner-course-workspace";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";

export default async function LearnerCoursePage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const workspace =
    await getLearnerCourseWorkspace(
      context,
      deliveryId,
    );

  return (
    <div className="space-y-5">
      <Link
        href="/learn/courses"
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← My Courses
      </Link>
      <LearnerCourseWorkspace
        deliveryId={deliveryId}
        workspace={workspace}
      />
    </div>
  );
}
