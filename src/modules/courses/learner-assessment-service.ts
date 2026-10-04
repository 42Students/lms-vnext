import type { RequestContext } from "@/modules/identity/context";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "./learner-course-service";

function byDueDateThenTitle<
  T extends {
    dueAt: Date | null;
    title: string;
  },
>(left: T, right: T) {
  const leftDue =
    left.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;
  const rightDue =
    right.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  return (
    leftDue - rightDue ||
    left.title.localeCompare(right.title)
  );
}

export async function getLearnerAssessmentOverview(
  context: RequestContext,
) {
  const deliveries =
    await listLearnerCourseDeliveries(context);
  const rows = await Promise.all(
    deliveries.map(async (delivery) => ({
      delivery,
      workspace:
        await getLearnerCourseWorkspace(
          context,
          delivery.deliveryId,
        ),
    })),
  );

  const assignments = rows.flatMap(
    ({ delivery, workspace }) =>
      workspace.lessons.flatMap((lesson) =>
        lesson.assignments.map(
          (assignment) => ({
            ...assignment,
            deliveryId:
              delivery.deliveryId,
            courseId: delivery.courseId,
            courseName:
              delivery.courseName,
            courseCode:
              delivery.courseCode,
            lessonId: lesson.id,
            lessonName: lesson.name,
          }),
        ),
      ),
  );

  const quizzes = rows.flatMap(
    ({ delivery, workspace }) =>
      workspace.lessons.flatMap((lesson) =>
        lesson.quizzes.map((quiz) => ({
          ...quiz,
          deliveryId:
            delivery.deliveryId,
          courseId: delivery.courseId,
          courseName:
            delivery.courseName,
          courseCode:
            delivery.courseCode,
          lessonId: lesson.id,
          lessonName: lesson.name,
        })),
      ),
  );

  assignments.sort(byDueDateThenTitle);
  quizzes.sort(byDueDateThenTitle);

  const courses = [
    ...new Map(
      deliveries.map((delivery) => [
        delivery.courseId,
        {
          id: delivery.courseId,
          name: delivery.courseName,
          code: delivery.courseCode,
        },
      ]),
    ).values(),
  ].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    courses,
    assignments,
    quizzes,
  };
}
