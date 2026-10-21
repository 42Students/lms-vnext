import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courses,
  departments,
  programs,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadSectionScope } from "@/modules/academics/scope";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseOfferingScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  courseOfferingIdSchema,
  courseSectionDeliveryIdSchema,
  createCourseSectionDeliveryInputSchema,
  type CreateCourseSectionDeliveryInput,
} from "./validation";

/** Semester-course mapping → offering → section delivery → faculty chain:
 * offering course/cohort/period is the tenant-scoped source of truth.
 * A section from a different cohort, period or college must not receive
 * teaching assignments through this delivery, even after a concurrent edit.
 */
export function courseDeliveryMatchesOffering(
 offering:{collegeId:string;cohortId:string;academicPeriodId:string},
 section:{collegeId:string;cohortId:string;academicPeriodId:string},
):boolean {
 return offering.collegeId===section.collegeId &&
  offering.cohortId===section.cohortId &&
  offering.academicPeriodId===section.academicPeriodId;
}

function mapDeliveryConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "course_section_deliveries_active_uq"
  ) {
    return new CoursesServiceError(
      "SECTION_DELIVERY_CONFLICT",
    );
  }

  return error;
}

export async function listCourseSectionDeliveries(
  context: RequestContext,
  offeringIdInput: string,
  includeEnded = false,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const offering =
    await loadCourseOfferingScope(
      offeringId,
      includeEnded,
    );

  requirePermission(context, "courses.read", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });

  const conditions = [
    eq(
      courseSectionDeliveries.offeringId,
      offeringId,
    ),
  ];

  if (!includeEnded) {
    conditions.push(
      isNull(courseSectionDeliveries.endedAt),
    );
  }

  return getDb()
    .select({
      id: courseSectionDeliveries.id,
      offeringId:
        courseSectionDeliveries.offeringId,
      sectionId:
        courseSectionDeliveries.sectionId,
      sectionName: sections.name,
      sectionCode: sections.code,
      startedAt:
        courseSectionDeliveries.startedAt,
      endedAt: courseSectionDeliveries.endedAt,
    })
    .from(courseSectionDeliveries)
    .innerJoin(
      sections,
      eq(
        sections.id,
        courseSectionDeliveries.sectionId,
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(sections.name));
}

export async function createCourseSectionDelivery(
  context: RequestContext,
  rawInput: CreateCourseSectionDeliveryInput,
) {
  const input =
    createCourseSectionDeliveryInputSchema.parse(
      rawInput,
    );
  const [offering, section] =
    await Promise.all([
      loadCourseOfferingScope(
        input.offeringId,
      ),
      loadSectionScope(input.sectionId),
    ]);

  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });

  if (
    section.status !== "ACTIVE" ||
    !courseDeliveryMatchesOffering(offering, section)
  ) {
    throw new CoursesServiceError(
      "SECTION_NOT_DELIVERABLE",
    );
  }

  try {
    return await getDb().transaction(async (tx) => {
      // Recheck ACTIVE after acquiring the parent's SHARE row lock.
      // An offering archival FOR UPDATE must serialize with this create.
      const [activeOffering] = await tx
        .select({
          id: courseOfferings.id,
          cohortId: courseOfferings.cohortId,
          academicPeriodId: courseOfferings.academicPeriodId,
          collegeId: departments.collegeId,
        })
        .from(courseOfferings)
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .innerJoin(departments, eq(departments.id, courses.departmentId))
        .where(and(
          eq(courseOfferings.id, input.offeringId),
          eq(courseOfferings.status, "ACTIVE"),
        ))
        .for("share")
        .limit(1);

      if (!activeOffering) {
        throw new CoursesServiceError("OFFERING_NOT_FOUND");
      }
      if (activeOffering.collegeId !== offering.collegeId) {
        // The grant was evaluated against the previous offering college.
        throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH");
      }

      // The pre-transaction section eligibility check can become stale if
      // a section is archived or rescheduled before we insert this delivery.
      // SHARE locks the exact section row and rechecks it against the locked
      // offering. A section reassignment cannot commit between this read
      // and the child insert through the normal academic update path.
      const [lockedSection] = await tx
        .select({
          id: sections.id,
          cohortId: sections.cohortId,
          academicPeriodId: sections.academicPeriodId,
          status: sections.status,
          collegeId: departments.collegeId,
        })
        .from(sections)
        .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
        .innerJoin(programs, eq(programs.id, cohorts.programId))
        .innerJoin(departments, eq(departments.id, programs.departmentId))
        .where(eq(sections.id, input.sectionId))
        .for("share")
        .limit(1);

      if (
        !lockedSection ||
        lockedSection.status !== "ACTIVE" ||
        !courseDeliveryMatchesOffering(activeOffering, lockedSection)
      ) {
        throw new CoursesServiceError("SECTION_NOT_DELIVERABLE");
      }

      const [created] = await tx
        .insert(courseSectionDeliveries)
        .values(input)
        .returning();

      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapDeliveryConstraint(error);
  }
}

export async function endCourseSectionDelivery(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const current =
    await loadCourseSectionDeliveryScope(
      deliveryId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  // Serialize against new teaching assignments. Their delivery FK check
  // takes KEY SHARE; FOR UPDATE on this delivery blocks that insert until
  // the end operation commits (or observes the newly inserted teacher).
  return getDb().transaction(async (tx) => {
    const [lockedDelivery] = await tx
      .select({ id: courseSectionDeliveries.id })
      .from(courseSectionDeliveries)
      .where(and(
        eq(courseSectionDeliveries.id, deliveryId),
        isNull(courseSectionDeliveries.endedAt),
        eq(courseSectionDeliveries.offeringId, current.offeringId),
        eq(courseSectionDeliveries.sectionId, current.sectionId),
      ))
      .for("update")
      .limit(1);

    if (!lockedDelivery) {
      throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
    }

    const [activeTeacher] = await tx
      .select({ id: courseTeachingAssignments.id })
      .from(courseTeachingAssignments)
      .where(and(
        eq(courseTeachingAssignments.deliveryId, deliveryId),
        isNull(courseTeachingAssignments.endedAt),
      ))
      .limit(1);

    if (activeTeacher) {
      throw new CoursesServiceError("DELIVERY_HAS_ACTIVE_TEACHERS");
    }

    const now = new Date();
    const [updated] = await tx
      .update(courseSectionDeliveries)
      .set({
        endedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(courseSectionDeliveries.id, deliveryId),
        isNull(courseSectionDeliveries.endedAt),
        eq(courseSectionDeliveries.offeringId, current.offeringId),
        eq(courseSectionDeliveries.sectionId, current.sectionId),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
    }

    return updated;
  });
}
