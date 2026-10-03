import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";
import { listCourses } from "./course-service";
import {
  listLearningPaths,
} from "./learning-path-service";
import {
  listCourseLessons,
} from "./lesson-service";
import {
  listLessonContents,
} from "./lesson-content-service";
import {
  listCourseAssignments,
} from "./assignment-service";
import {
  listCourseQuizzes,
} from "./quiz-service";
import {
  loadCourseOfferingScope,
} from "./scope";

export async function getAdminOfferingLearningWorkspace(
  context: RequestContext,
  offeringId: string,
) {
  const offering =
    await loadCourseOfferingScope(offeringId);

  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });

  const [academics, courses, paths] =
    await Promise.all([
      getAcademicsWorkspace(
        context,
        offering.collegeId,
      ),
      listCourses(
        context,
        offering.collegeId,
      ),
      listLearningPaths(
        context,
        offering.id,
      ),
    ]);

  const course = courses.find(
    (candidate) =>
      candidate.id === offering.courseId,
  );
  const cohort = academics.cohorts.find(
    (candidate) =>
      candidate.id === offering.cohortId,
  );
  const period = academics.periods.find(
    (candidate) =>
      candidate.id ===
      offering.academicPeriodId,
  );

  if (!course || !cohort || !period) {
    throw new Error(
      "Course Offering structure is incomplete",
    );
  }

  const path = paths[0] ?? null;

  if (!path) {
    return {
      offering: {
        ...offering,
        courseName: course.name,
        courseCode: course.code,
        departmentName:
          course.departmentName,
        cohortName: cohort.name,
        cohortCode: cohort.code,
        academicPeriodName:
          period.name,
        academicPeriodCode:
          period.code,
      },
      learningPath: null,
      lessons: [],
    };
  }

  const lessonRows =
    await listCourseLessons(
      context,
      path.id,
    );

  const lessons = await Promise.all(
    lessonRows.map(async (lesson) => {
      const [
        contents,
        assignments,
        quizzes,
      ] = await Promise.all([
        listLessonContents(
          context,
          lesson.id,
          null,
        ),
        listCourseAssignments(
          context,
          lesson.id,
          null,
        ),
        listCourseQuizzes(
          context,
          lesson.id,
          null,
        ),
      ]);

      return {
        ...lesson,
        contents,
        assignments,
        quizzes,
        nextContentSequence:
          contents.reduce(
            (max, item) =>
              Math.max(
                max,
                item.sequence + 1,
              ),
            0,
          ),
        nextAssignmentSequence:
          assignments.reduce(
            (max, item) =>
              Math.max(
                max,
                item.sequence + 1,
              ),
            0,
          ),
        nextQuizSequence:
          quizzes.reduce(
            (max, item) =>
              Math.max(
                max,
                item.sequence + 1,
              ),
            0,
          ),
      };
    }),
  );

  return {
    offering: {
      ...offering,
      courseName: course.name,
      courseCode: course.code,
      departmentName:
        course.departmentName,
      cohortName: cohort.name,
      cohortCode: cohort.code,
      academicPeriodName: period.name,
      academicPeriodCode: period.code,
    },
    learningPath: path,
    lessons,
  };
}
