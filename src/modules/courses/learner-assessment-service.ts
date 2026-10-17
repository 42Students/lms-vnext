import type { RequestContext } from "@/modules/identity/context";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {learnerProgramEnrollments,sectionEnrollments} from "@/db/schema";
import {AuthorizationError} from "@/modules/permissions/policy";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
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
  await requireOwnCourseLearnerRead(context);
  const snapshotNowMs = Date.now();
  const deliveries =
    await listLearnerCourseDeliveries(context);
  // An empty published course list does not prove the learner has no class.
  // Probe persisted ACTIVE learner-section enrollment instead.
  let classScope:"NONE"|"PRESENT"|"UNAVAILABLE"="NONE";
  try{
    if(!context.membership)throw new AuthorizationError("courses.read");
    const classes=await getDb().select({id:sectionEnrollments.id})
      .from(sectionEnrollments)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
      .where(and(eq(learnerProgramEnrollments.membershipId,context.membership.id),
        eq(learnerProgramEnrollments.status,"ACTIVE"),
        eq(sectionEnrollments.status,"ACTIVE")))
      .limit(1);
    classScope=classes.length>0?"PRESENT":"NONE";
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    classScope="UNAVAILABLE";
  }
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
    snapshotNowMs,
    classScope,
    courses,
    assignments,
    quizzes,
  };
}
