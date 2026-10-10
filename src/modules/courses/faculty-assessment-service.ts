import { listFacultyCourseDeliveries, getFacultyCourseWorkspace } from "./faculty-course-service";
import type { RequestContext } from "@/modules/identity/context";

/**
 * Faculty all-assessment daily-use surfaces. Scope comes exclusively from
 * persisted, active teaching assignments (including class/Section context),
 * never a caller-supplied list of course IDs. Reuse the canonical authoring
 * workspace so shared offering and section-local assessments stay separate.
 */
export async function getFacultyAssessmentOverview(context: RequestContext) {
  const courses = await listFacultyCourseDeliveries(context);
  const scopes = await Promise.all(
    courses.map(async (course) => ({
      course,
      workspace: await getFacultyCourseWorkspace(context, course.deliveryId),
    })),
  );

  const assignments = scopes.flatMap(({ course, workspace }) =>
    workspace.lessons.flatMap((lesson) =>
      lesson.assignments.map((assignment) => ({
        ...assignment,
        kind: "ASSIGNMENT" as const,
        deliveryId: course.deliveryId,
        authoredDeliveryId: assignment.deliveryId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        sectionName: course.sectionName,
        sectionCode: course.sectionCode,
        academicPeriodName: course.academicPeriodName,
        lessonName: lesson.name,
        lessonId: lesson.id,
        facultyOwned: assignment.deliveryId === course.deliveryId,
      })),
    ),
  );

  const quizzes = scopes.flatMap(({ course, workspace }) =>
    workspace.lessons.flatMap((lesson) =>
      lesson.quizzes.map((quiz) => ({
        ...quiz,
        kind: "QUIZ" as const,
        deliveryId: course.deliveryId,
        authoredDeliveryId: quiz.deliveryId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        sectionName: course.sectionName,
        sectionCode: course.sectionCode,
        academicPeriodName: course.academicPeriodName,
        lessonName: lesson.name,
        lessonId: lesson.id,
        facultyOwned: quiz.deliveryId === course.deliveryId,
      })),
    ),
  );

  function orderByDueTitle<T extends { dueAt: Date | null; title: string }>(
    a: T,
    b: T,
  ) {
    return (
      (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title)
    );
  }
  assignments.sort(orderByDueTitle);
  quizzes.sort(orderByDueTitle);

  const lessonChoices = scopes.flatMap(
    ({ course, workspace }) =>
      workspace.lessons.map((lesson) => {
        const sequences = [
          ...lesson.contents.map(
            (item) => item.sequence,
          ),
          ...lesson.assignments.map(
            (item) => item.sequence,
          ),
          ...lesson.quizzes.map(
            (item) => item.sequence,
          ),
        ];
        return {
          deliveryId: course.deliveryId,
          courseCode: course.courseCode,
          courseName: course.courseName,
          sectionName: course.sectionName,
          lessonId: lesson.id,
          lessonName: lesson.name,
          nextSequence:
            sequences.length === 0
              ? 0
              : Math.max(...sequences) + 1,
        };
      }),
  );

  return {
    courses: courses.map((course) => ({
      deliveryId: course.deliveryId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      sectionName: course.sectionName,
    })),
    lessonChoices,
    assignments,
    quizzes,
  };
}
