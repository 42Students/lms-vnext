import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseTabs, learnerCourseTabs } from "@/components/courses/learner-course-tabs";
import { LearnerCourseWorkspace } from "@/components/courses/learner-course-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";

export default async function LearnerCourseTabPage({
  params,
}: {
  params: Promise<{ deliveryId: string; courseTab: string[] }>;
}) {
  const { deliveryId, courseTab } = await params;
  const activeTab = courseTab[0] ?? "home";

  if (!learnerCourseTabs.some((tab) => tab.path === activeTab)) {
    notFound();
  }

  const context = await getCurrentRequestContext();
  const workspace = await getLearnerCourseWorkspace(context, deliveryId);

  let content: React.ReactNode;

  if (activeTab === "home" || activeTab === "roadmap") {
    content = <LearnerCourseWorkspace deliveryId={deliveryId} workspace={workspace} />;
  } else if (activeTab === "attendanceDetail") {
    content = (
      <PageHeader
        eyebrow={workspace.course.name}
        title="Attendance"
        description="Course attendance detail."
      />
    );
  } else {
    content = (
      <PageHeader
        eyebrow={workspace.course.name}
        title="Discussions"
        description="Course discussions."
      />
    );
  }

  return (
    <div className="space-y-6">
      <LearnerCourseTabs deliveryId={deliveryId} activeTab={activeTab} />
      {content}
    </div>
  );
}
