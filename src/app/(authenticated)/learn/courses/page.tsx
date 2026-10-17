import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerCourseList,
  type LearnerCourseListRow,
} from "@/components/courses/learner-course-list";
import {mapLearnerCourseCardsLimited} from "@/modules/courses/learner-course-list-concurrency-model";
import {getLearnerCourseSetupStatus} from "@/modules/courses/learner-course-setup-service";
import { learnerCourseInstructorLabels } from "@/modules/courses/learner-course-instructor-labels-model";
import { PageHeader } from "@/components/ui/page-header";
import { loadAuthorizedCourseDisplayContentsIfReady } from "@/modules/courses/course-display-service";
import { selectLearnerOverdueAssignment } from "@/modules/courses/learner-course-overdue-link-model";
import { learnerCourseListSignals } from "@/modules/courses/learner-course-overview-model";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
  listLearnerCourseInstructors,
} from "@/modules/courses/learner-course-service";

export default async function LearnerCoursesPage() {
  const context = await getCurrentRequestContext();
  const courses = await listLearnerCourseDeliveries(
    context,
    { includeHistorical: true },
  );

  let displays=new Map<string,{thumbnailUrl:string|null}>();
  try{
    displays=await loadAuthorizedCourseDisplayContentsIfReady(courses
      .map(course=>course.courseId).filter(id=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)));
  }catch{
    // Optional display metadata must not hide authenticated course cards.
    displays=new Map();
  }
  // Each delivery fails independently; one corrupt or temporarily unavailable
  // course must never hide the learner's remaining course cards.
  const seenDeliveries = new Set<string>();
  const rows: LearnerCourseListRow[] = await mapLearnerCourseCardsLimited(
    courses, async (course, index) => {
      const duplicate = seenDeliveries.has(course.deliveryId);
      seenDeliveries.add(course.deliveryId);
      const baseCourse = {
        deliveryId: duplicate || !course.deliveryId ? "unavailable-" + index : course.deliveryId,
        courseId: course.courseId,
        courseName: course.courseName || "Course name unavailable",
        courseCode: course.courseCode,
        courseDescription: course.courseDescription,
        offeringType: course.offeringType,
        credits: course.credits,
        sectionName: course.sectionName,
        sectionCode: course.sectionCode,
        cohortName: course.cohortName,
        academicPeriodId: course.academicPeriodId,
        academicPeriodName: course.academicPeriodName,
        programName: course.programName,
        programCode: course.programCode,
        periodStartDate: course.periodStartDate,
        periodEndDate: course.periodEndDate,
      };
      const unavailable = (label: string): LearnerCourseListRow => ({
        course: baseCourse,
        thumbnailUrl: null,
        instructorNames: [],
        summary: {overallPercent: null, itemsCompleted: 0, itemsTotal: 0},
        lastActivity: null,
        nextDue: null,
        readOnly: true,
        learningPathReady: false,
        nextItem: null,
        unavailable: true,
        unavailableLabel: label,
      });
      if (duplicate) return unavailable("Duplicate course mapping " + (index + 1));
      if (!course.deliveryId || !course.courseId || !course.academicPeriodId ||
          typeof course.courseName !== "string" || !course.courseName.trim()) {
        return unavailable("Invalid course record " + (index + 1));
      }
      try {
        const [workspace, instructors] = await Promise.all([
          getLearnerCourseWorkspace(context, course.deliveryId),
          listLearnerCourseInstructors(context, course.deliveryId),
        ]);
        const signals = learnerCourseListSignals(
          workspace.lessons, workspace.summary, new Date(workspace.snapshotNowMs),
        );
        return {
          thumbnailUrl: displays.get(course.courseId)?.thumbnailUrl ?? null,
          lastActivity: signals.lastActivity,
          overdueAssignments: signals.overdueAssignments,
          firstOverdue: selectLearnerOverdueAssignment(workspace.lessons,workspace.snapshotNowMs),
          nextDue: signals.nextDue,
          course: baseCourse,
          instructorNames: learnerCourseInstructorLabels(instructors),
          summary: {
            overallPercent: signals.percentage,
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
      } catch {
        // Never show internal access, database or content-fetch errors to learners.
        return unavailable("Course temporarily unavailable");
      }
    }, 4,
  );

  const setupStatus=rows.length===0?await getLearnerCourseSetupStatus(context):null;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
      />
      <LearnerCourseList rows={rows} setupStatus={setupStatus} />
    </div>
  );
}
