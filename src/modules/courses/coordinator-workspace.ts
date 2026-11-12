import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, courses, departments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireOfferingContentAuthority } from "./coordinator-service";
import { CoursesServiceError } from "./errors";
import { listLearningPaths } from "./learning-path-service";
import { listCourseLessons } from "./lesson-service";
import { listLessonContents } from "./lesson-content-service";
import { listCourseAssignments } from "./assignment-service";
import { listCourseQuizzes } from "./quiz-service";
import { loadCourseOfferingScope } from "./scope";

/**
 * The shared (all-sections) learning structure of one offering, for its coordinator. It has the same shape the admin
 * course screen uses, but it only reads what a coordinator is allowed to see: no academics workspace, no course
 * catalogue, and only items shared by every section. Admins may open it too.
 */
export async function getCoordinatorOfferingWorkspace(context: RequestContext, offeringId: string) {
  const offering = await loadCourseOfferingScope(offeringId);
  await requireOfferingContentAuthority(context, {
    id: offering.id,
    collegeId: offering.collegeId,
    organizationId: offering.organizationId,
  });

  const [names] = await getDb()
    .select({
      courseName: courses.name,
      courseCode: courses.code,
      departmentName: departments.name,
      cohortName: cohorts.name,
      cohortCode: cohorts.code,
      academicPeriodName: academicPeriods.name,
      academicPeriodCode: academicPeriods.code,
    })
    .from(courses)
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(cohorts, eq(cohorts.id, offering.cohortId))
    .innerJoin(academicPeriods, eq(academicPeriods.id, offering.academicPeriodId))
    .where(eq(courses.id, offering.courseId))
    .limit(1);
  if (!names) throw new CoursesServiceError("OFFERING_NOT_FOUND");

  const header = { ...offering, ...names };
  const path = (await listLearningPaths(context, offering.id))[0] ?? null;
  if (!path) return { offering: header, learningPath: null, lessons: [] };

  const lessonRows = await listCourseLessons(context, path.id);
  const lessons = await Promise.all(
    lessonRows.map(async (lesson) => {
      const [contents, assignments, quizzes] = await Promise.all([
        listLessonContents(context, lesson.id, null),
        listCourseAssignments(context, lesson.id, null),
        listCourseQuizzes(context, lesson.id, null),
      ]);
      const next = (rows: readonly { sequence: number }[]) =>
        rows.reduce((max, item) => Math.max(max, item.sequence + 1), 0);
      return {
        ...lesson,
        contents,
        assignments,
        quizzes,
        nextContentSequence: next(contents),
        nextAssignmentSequence: next(assignments),
        nextQuizSequence: next(quizzes),
      };
    }),
  );
  return { offering: header, learningPath: path, lessons };
}
