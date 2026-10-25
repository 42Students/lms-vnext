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
    <div className="faculty-prototype-discussion min-w-0 max-w-full space-y-4">
      <header className="min-w-0 border-b border-[#e5ebf2] pb-5">
        <h2 className="text-xl font-bold text-[#1d293f]">Course discussions · {workspace.course.sectionName}</h2>
        <p className="mt-1 text-sm text-body">Everyone in this class who takes this course can see these messages. Other classes have their own.</p>
      </header>
      <LearnerCourseDiscussion
        key={deliveryId}
        deliveryId={deliveryId}
        moderate
      />
    </div>
  );
}
