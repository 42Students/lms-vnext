import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseSectionDeliveries,
  courseTeachingAssignments,
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
    offering.collegeId !== section.collegeId ||
    offering.cohortId !== section.cohortId ||
    offering.academicPeriodId !==
      section.academicPeriodId
  ) {
    throw new CoursesServiceError(
      "SECTION_NOT_DELIVERABLE",
    );
  }

  try {
    const [created] = await getDb()
      .insert(courseSectionDeliveries)
      .values(input)
      .returning();

    return created;
  } catch (error) {
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

  const db = getDb();
  const [activeTeacher] = await db
    .select({ id: courseTeachingAssignments.id })
    .from(courseTeachingAssignments)
    .where(
      and(
        eq(
          courseTeachingAssignments.deliveryId,
          deliveryId,
        ),
        isNull(
          courseTeachingAssignments.endedAt,
        ),
      ),
    )
    .limit(1);

  if (activeTeacher) {
    throw new CoursesServiceError(
      "DELIVERY_HAS_ACTIVE_TEACHERS",
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(courseSectionDeliveries)
    .set({
      endedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          courseSectionDeliveries.id,
          deliveryId,
        ),
        isNull(
          courseSectionDeliveries.endedAt,
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "SECTION_DELIVERY_NOT_FOUND",
    );
  }

  return updated;
}
