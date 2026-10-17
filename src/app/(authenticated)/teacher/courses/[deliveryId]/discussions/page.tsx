import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyCourseWorkspace } from "@/modules/courses/faculty-course-service";

export default async function FacultyCourseDiscussionsPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const workspace =
    await getFacultyCourseWorkspace(
      context,
      deliveryId,
    );

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/courses/${deliveryId}/home`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        ← Course workspace
      </Link>
      <PageHeader
        eyebrow="Faculty · Course"
        title="Discussions"
        description={`${workspace.course.courseName} · ${workspace.course.sectionName}`}
      />
      <LearnerCourseDiscussion
        key={deliveryId}
        deliveryId={deliveryId}
        moderate
      />
    </div>
  );
}
