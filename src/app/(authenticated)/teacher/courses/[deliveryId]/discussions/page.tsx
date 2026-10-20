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
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        eyebrow="Faculty · Course"
        title="Discussions"
        description={`${workspace.course.courseName} · ${workspace.course.sectionName}`}
        actions={<Link href={`/teacher/courses/${encodeURIComponent(deliveryId)}/home`} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← Course workspace</Link>}
      />
      <LearnerCourseDiscussion
        key={deliveryId}
        deliveryId={deliveryId}
        moderate
      />
    </div>
  );
}
