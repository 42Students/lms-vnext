import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  courseOfferings,
  courseSectionDeliveries,
  courses,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  loadAcademicPeriodScope,
  loadCohortScope,
} from "@/modules/academics/scope";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseOfferingScope,
  loadCourseScope,
} from "./scope";
import {
  cohortIdSchema,
  academicPeriodIdSchema,
} from "@/modules/academics/validation";
import {
  courseOfferingIdSchema,
  createCourseOfferingInputSchema,
  updateCourseOfferingInputSchema,
  type CreateCourseOfferingInput,
  type UpdateCourseOfferingInput,
} from "./validation";

function mapOfferingConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "course_offerings_active_uq"
  ) {
    return new CoursesServiceError(
      "OFFERING_CONFLICT",
    );
  }

  return error;
}

async function validateOfferingStructure(input: {
  courseId: string;
  cohortId: string;
  academicPeriodId: string;
}) {
  const [course, cohort, period] =
    await Promise.all([
      loadCourseScope(input.courseId),
      loadCohortScope(input.cohortId),
      loadAcademicPeriodScope(
        input.academicPeriodId,
      ),
    ]);

  if (
    course.collegeId !== cohort.collegeId ||
    course.collegeId !== period.collegeId
  ) {
    throw new CoursesServiceError(
      "COURSE_COLLEGE_MISMATCH",
    );
  }

  if (
    cohort.status !== "PLANNED" &&
    cohort.status !== "ACTIVE"
  ) {
    throw new CoursesServiceError(
      "COHORT_NOT_MUTABLE",
    );
  }

  if (period.status === "CLOSED") {
    throw new CoursesServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  const startPeriod =
    await loadAcademicPeriodScope(
      cohort.startPeriodId,
    );

  if (period.startDate < startPeriod.startDate) {
    throw new CoursesServiceError(
      "OFFERING_COHORT_PERIOD_MISMATCH",
    );
  }

  if (cohort.expectedEndPeriodId) {
    const endPeriod =
      await loadAcademicPeriodScope(
        cohort.expectedEndPeriodId,
      );

    if (period.endDate > endPeriod.endDate) {
      throw new CoursesServiceError(
        "OFFERING_COHORT_PERIOD_MISMATCH",
      );
    }
  }

  return { course };
}

export async function listCourseOfferings(
  context: RequestContext,
  cohortIdInput: string,
  academicPeriodIdInput?: string | null,
  includeArchived = false,
) {
  const cohortId =
    cohortIdSchema.parse(cohortIdInput);
  const cohort = await loadCohortScope(cohortId);

  requirePermission(context, "courses.read", {
    organizationId: cohort.organizationId,
    collegeId: cohort.collegeId,
  });

  const academicPeriodId =
    academicPeriodIdInput
      ? academicPeriodIdSchema.parse(
          academicPeriodIdInput,
        )
      : null;

  if (academicPeriodId) {
    const period =
      await loadAcademicPeriodScope(
        academicPeriodId,
      );

    if (period.collegeId !== cohort.collegeId) {
      throw new CoursesServiceError(
        "OFFERING_COHORT_PERIOD_MISMATCH",
      );
    }
  }

  const conditions = [
    eq(courseOfferings.cohortId, cohortId),
  ];

  if (academicPeriodId) {
    conditions.push(
      eq(
        courseOfferings.academicPeriodId,
        academicPeriodId,
      ),
    );
  }

  if (!includeArchived) {
    conditions.push(
      eq(courseOfferings.status, "ACTIVE"),
    );
  }

  return getDb()
    .select({
      id: courseOfferings.id,
      courseId: courseOfferings.courseId,
      courseName: courses.name,
      courseCode: courses.code,
      cohortId: courseOfferings.cohortId,
      academicPeriodId:
        courseOfferings.academicPeriodId,
      academicPeriodName: academicPeriods.name,
      type: courseOfferings.type,
      credits: courseOfferings.credits,
      displayOrder: courseOfferings.displayOrder,
      status: courseOfferings.status,
      createdAt: courseOfferings.createdAt,
      updatedAt: courseOfferings.updatedAt,
    })
    .from(courseOfferings)
    .innerJoin(
      courses,
      eq(courses.id, courseOfferings.courseId),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        courseOfferings.academicPeriodId,
      ),
    )
    .where(and(...conditions))
    .orderBy(
      asc(courseOfferings.displayOrder),
      asc(courses.name),
    );
}

export async function createCourseOffering(
  context: RequestContext,
  rawInput: CreateCourseOfferingInput,
) {
  const input =
    createCourseOfferingInputSchema.parse(
      rawInput,
    );
  const { course } =
    await validateOfferingStructure(input);

  requirePermission(context, "courses.manage", {
    organizationId: course.organizationId,
    collegeId: course.collegeId,
  });

  try {
    const [created] = await getDb()
      .insert(courseOfferings)
      .values({
        courseId: input.courseId,
        cohortId: input.cohortId,
        academicPeriodId:
          input.academicPeriodId,
        type: input.type,
        credits: input.credits ?? null,
        displayOrder: input.displayOrder,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapOfferingConstraint(error);
  }
}

export async function updateCourseOffering(
  context: RequestContext,
  offeringIdInput: string,
  rawInput: UpdateCourseOfferingInput,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const input =
    updateCourseOfferingInputSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseOfferingScope(offeringId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (
    current.periodStatus === "CLOSED" ||
    (current.cohortStatus !== "PLANNED" &&
      current.cohortStatus !== "ACTIVE")
  ) {
    throw new CoursesServiceError(
      "OFFERING_NOT_MUTABLE",
    );
  }

  const [updated] = await getDb()
    .update(courseOfferings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "OFFERING_NOT_FOUND",
    );
  }

  return updated;
}

export async function archiveCourseOffering(
  context: RequestContext,
  offeringIdInput: string,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const current =
    await loadCourseOfferingScope(offeringId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const db = getDb();
  const [delivery] = await db
    .select({ id: courseSectionDeliveries.id })
    .from(courseSectionDeliveries)
    .where(
      and(
        eq(
          courseSectionDeliveries.offeringId,
          offeringId,
        ),
        isNull(
          courseSectionDeliveries.endedAt,
        ),
      ),
    )
    .limit(1);

  if (delivery) {
    throw new CoursesServiceError(
      "OFFERING_HAS_ACTIVE_DELIVERIES",
    );
  }

  const [archived] = await db
    .update(courseOfferings)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseOfferings.id, offeringId),
        eq(courseOfferings.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!archived) {
    throw new CoursesServiceError(
      "OFFERING_NOT_FOUND",
    );
  }

  return archived;
}
