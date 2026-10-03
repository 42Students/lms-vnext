import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseList } from "@/components/courses/learner-course-list";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

export default async function LearnerCoursesPage() {
  const context = await getCurrentRequestContext();
  const courses =
    await listLearnerCourseDeliveries(context);
  const rows = await Promise.all(
    courses.map(async (course) => ({
      course,
      workspace:
        await getLearnerCourseWorkspace(
          context,
          course.deliveryId,
        ),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="My Courses"
        description="Your current Section courses, progress and the next useful learning action in each course."
      />
      <LearnerCourseList rows={rows} />
    </div>
  );
}
