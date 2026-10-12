import { and, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseLearningPaths, courseOfferings, courses,
  departments, colleges, organizations,
  cohorts, programs, academicPeriods,
} from "@/db/schema";
import { CoursesServiceError } from "./errors";
import type { loadLearningPathScope } from "./scope";

/**
 * Lock persisted lesson ancestors under the write transaction, and require
 * the same offering, course, cohort, term and college used for authorization.
 * Changes to any locked parent wait until the lesson write commits.
 */
export async function lockLiveLessonWriteAncestry(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  expected: Awaited<ReturnType<typeof loadLearningPathScope>>,
) {
  const [path] = await tx.select({ id: courseLearningPaths.id })
    .from(courseLearningPaths)
    .where(and(
      eq(courseLearningPaths.id, expected.id),
      eq(courseLearningPaths.offeringId, expected.offeringId),
      ne(courseLearningPaths.status, "ARCHIVED"),
    )).for("share").limit(1);
  if (!path) throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");

  const [offering] = await tx.select({
      courseId: courseOfferings.courseId,
      cohortId: courseOfferings.cohortId,
      academicPeriodId: courseOfferings.academicPeriodId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(courseOfferings.id, expected.offeringId),
      eq(courseOfferings.status, "ACTIVE"),
      eq(courses.status, "ACTIVE"),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    )).for("share").limit(1);

  if (!offering ||
      offering.courseId !== expected.courseId ||
      offering.cohortId !== expected.cohortId ||
      offering.academicPeriodId !== expected.academicPeriodId ||
      offering.collegeId !== expected.collegeId ||
      offering.organizationId !== expected.organizationId) {
    throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
  }

  // Cohort and period tenancy are separate parent chains, not inferred from
  // the offering's course college. Lock them so same-ID upstream reparenting
  // cannot make an authorized lesson write cross-college after pre-read.
  const [cohort] = await tx.select({ collegeId: departments.collegeId })
    .from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(cohorts.id, offering.cohortId),
      eq(programs.status, "ACTIVE"),
      isNull(departments.archivedAt),
    )).for("share").limit(1);

  const [period] = await tx.select({ collegeId: academicPeriods.collegeId })
    .from(academicPeriods)
    .where(eq(academicPeriods.id, offering.academicPeriodId))
    .for("share").limit(1);

  if (!cohort || !period ||
      cohort.collegeId !== expected.collegeId ||
      period.collegeId !== expected.collegeId) {
    throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
  }
}

