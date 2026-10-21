import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
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
      <header className="min-w-0 border-b border-border pb-3">
        <h2 className="text-base font-semibold text-foreground">Discussions</h2>
        <p className="mt-1 text-sm text-body">Keep course conversations in one place and follow along easily.</p>
        <p className="mt-1 text-xs text-muted-foreground">{workspace.course.courseName} · {workspace.course.sectionName}</p>
      </header>
      <LearnerCourseDiscussion
        key={deliveryId}
        deliveryId={deliveryId}
        moderate
      />
    </div>
  );
}
