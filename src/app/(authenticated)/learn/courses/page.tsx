import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerCourseList,
  type LearnerCourseListRow,
} from "@/components/courses/learner-course-list";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

export default async function LearnerCoursesPage() {
  const context = await getCurrentRequestContext();
  const courses = await listLearnerCourseDeliveries(
    context,
    { includeHistorical: true },
  );

  const rows: LearnerCourseListRow[] = await Promise.all(
    courses.map(async (course) => {
      const workspace = await getLearnerCourseWorkspace(
        context,
        course.deliveryId,
      );

      return {
        course: {
          deliveryId: course.deliveryId,
          courseId: course.courseId,
          courseName: course.courseName,
          courseCode: course.courseCode,
          courseDescription: course.courseDescription,
          offeringType: course.offeringType,
          credits: course.credits,
          sectionName: course.sectionName,
          sectionCode: course.sectionCode,
          academicPeriodId: course.academicPeriodId,
          academicPeriodName: course.academicPeriodName,
          programName: course.programName,
          programCode: course.programCode,
          periodStartDate: course.periodStartDate,
          periodEndDate: course.periodEndDate,
        },
        summary: {
          overallPercent: workspace.summary.overallPercent,
          itemsCompleted: workspace.summary.itemsCompleted,
          itemsTotal: workspace.summary.itemsTotal,
        },
        readOnly:
          Boolean(course.deliveryEndedAt) ||
          course.sectionEnrollmentStatus !== "ACTIVE" ||
          course.programEnrollmentStatus !== "ACTIVE" ||
          course.periodStatus === "CLOSED",
        learningPathReady: workspace.learningPath !== null,
        nextItem: workspace.nextItem
          ? {
              lessonId: workspace.nextItem.lessonId,
              lessonName: workspace.nextItem.lessonName,
              kind: workspace.nextItem.kind,
              itemId: workspace.nextItem.itemId,
              title: workspace.nextItem.title,
            }
          : null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Courses"
        description={rows[0]?.course.programName
          ? `${rows[0].course.programName} · Your semester courses, electives, credits and learning progress.`
          : "Your semester courses, electives, credits and learning progress."}
      />
      <LearnerCourseList rows={rows} />
    </div>
  );
}
