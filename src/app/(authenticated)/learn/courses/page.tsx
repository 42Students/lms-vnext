import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerCourseList,
  type LearnerCourseListRow,
} from "@/components/courses/learner-course-list";
import { learnerCourseInstructorLabels } from "@/modules/courses/learner-course-instructor-labels-model";
import {partitionLearnerCourseLoads, LEARNER_UNAVAILABLE_COURSE_COPY} from "@/modules/courses/learner-course-load-isolation-model";
import { PageHeader } from "@/components/ui/page-header";
import { loadCourseDisplayContentIfReady } from "@/modules/courses/course-display-service";
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

  // LEARNER-home-courses-R01: one failed delivery never hides the others.
  const results = await Promise.allSettled(
    courses.map(async (course): Promise<LearnerCourseListRow> => {
      const [workspace, instructors, display] = await Promise.all([
        getLearnerCourseWorkspace(
          context,
          course.deliveryId,
        ),
        listLearnerCourseInstructors(
          context,
          course.deliveryId,
        ),
        loadCourseDisplayContentIfReady(course.courseId),
      ]);

      const signals=learnerCourseListSignals(workspace.lessons,workspace.summary,
        new Date(workspace.snapshotNowMs));
      return {
        thumbnailUrl: display?.thumbnailUrl ?? null,
        lastActivity:signals.lastActivity,
        overdueAssignments: signals.overdueAssignments,
        firstOverdue: selectLearnerOverdueAssignment(workspace.lessons,workspace.snapshotNowMs),
        nextDue:signals.nextDue,
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
    }),
  );
  const {loaded:rows,failed:unavailable} = partitionLearnerCourseLoads(courses,results);

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" />
      {unavailable.length ? (
        <section aria-label="Unavailable course records" className="space-y-3">
          <div role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">
            {LEARNER_UNAVAILABLE_COURSE_COPY}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {unavailable.map((course,index)=>(
              <article key={course.deliveryId}
                className="rounded-xl border border-border bg-surface p-5 text-sm">
                <h2 className="font-semibold text-foreground">
                  {course.courseName.trim() || "Invalid course record "+(index+1)}
                </h2>
                <p className="mt-1 text-xs text-body">{course.academicPeriodName}</p>
                <p className="mt-3 text-body">Course details temporarily unavailable.</p>
                <a href="/learn/courses" className="mt-3 inline-flex min-h-11 items-center text-primary-text underline">Retry</a>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {rows.length || !courses.length ? <LearnerCourseList rows={rows} /> : null}
    </div>
  );
}
