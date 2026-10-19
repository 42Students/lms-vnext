import { PageBackLink } from "@/components/ui/page-back-link";
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
    <div className="min-w-0 max-w-full space-y-5">
      <PageBackLink href={`/teacher/courses/${deliveryId}/home`} label="Course workspace" />
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
