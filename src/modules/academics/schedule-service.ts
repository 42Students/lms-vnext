import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadCourseSectionDeliveryScope } from "@/modules/courses/scope";
import { AcademicsServiceError } from "./errors";
import {
  loadAcademicsMembership,
  loadScheduleEventScope,
  requireAcademicRole,
} from "./a2-scope";
import {
  loadAcademicPeriodScope,
  loadSectionScope,
} from "./scope";
import {
  createSectionScheduleEventInputSchema,
  scheduleEventIdSchema,
  scheduleEventTransitionSchema,
  sectionIdSchema,
  updateSectionScheduleEventInputSchema,
  type CreateSectionScheduleEventInput,
  type UpdateSectionScheduleEventInput,
} from "./validation";

function eventWindowInsidePeriod(
  startsAt: Date,
  endsAt: Date,
  period: Awaited<
    ReturnType<typeof loadAcademicPeriodScope>
  >,
) {
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_TIME_INVALID",
    );
  }

  const periodStart = new Date(
    `${period.startDate}T00:00:00.000Z`,
  ).getTime();
  const periodEndExclusive =
    new Date(
      `${period.endDate}T00:00:00.000Z`,
    ).getTime() +
    24 * 60 * 60 * 1000;

  if (
    startsAt.getTime() < periodStart ||
    endsAt.getTime() > periodEndExclusive
  ) {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_OUTSIDE_PERIOD",
    );
  }
}

async function validateFacultyForSection(
  membershipId: string | null | undefined,
  collegeId: string,
) {
  if (!membershipId) {
    return;
  }

  const membership =
    await loadAcademicsMembership(membershipId);
  requireAcademicRole(membership, "FACULTY");

  if (membership.collegeId !== collegeId) {
    throw new AcademicsServiceError(
      "MEMBERSHIP_COLLEGE_MISMATCH",
    );
  }
}

async function validateDeliveryForSection(
  deliveryId: string | null | undefined,
  sectionId: string,
) {
  if (!deliveryId) {
    return;
  }

  const delivery =
    await loadCourseSectionDeliveryScope(deliveryId);

  if (delivery.sectionId !== sectionId) {
    throw new AcademicsServiceError(
      "SCHEDULE_COURSE_DELIVERY_MISMATCH",
    );
  }
}

export async function listSectionScheduleCourseChoices(
  context: RequestContext,
  sectionIdInput: string,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "courses.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  return getDb()
    .select({
      deliveryId: courseSectionDeliveries.id,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(courseSectionDeliveries)
    .innerJoin(
      courseOfferings,
      and(
        eq(
          courseOfferings.id,
          courseSectionDeliveries.offeringId,
        ),
        eq(courseOfferings.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      courses,
      and(
        eq(courses.id, courseOfferings.courseId),
        eq(courses.status, "ACTIVE"),
      ),
    )
    .where(
      and(
        eq(
          courseSectionDeliveries.sectionId,
          sectionId,
        ),
        isNull(courseSectionDeliveries.endedAt),
      ),
    )
    .orderBy(asc(courses.name));
}

export async function listSectionScheduleEvents(
  context: RequestContext,
  sectionIdInput: string,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "academics.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  const db = getDb();

  return db
    .select({
      id: sectionScheduleEvents.id,
      sectionId: sectionScheduleEvents.sectionId,
      facultyMembershipId:
        sectionScheduleEvents.facultyMembershipId,
      facultyName: users.displayName,
      deliveryId:
        sectionScheduleEventCourses.deliveryId,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      status: sectionScheduleEvents.status,
      createdAt: sectionScheduleEvents.createdAt,
      updatedAt: sectionScheduleEvents.updatedAt,
    })
    .from(sectionScheduleEvents)
    .leftJoin(
      sectionScheduleEventCourses,
      eq(
        sectionScheduleEventCourses.scheduleEventId,
        sectionScheduleEvents.id,
      ),
    )
    .leftJoin(
      courseSectionDeliveries,
      eq(
        courseSectionDeliveries.id,
        sectionScheduleEventCourses.deliveryId,
      ),
    )
    .leftJoin(
      courseOfferings,
      eq(
        courseOfferings.id,
        courseSectionDeliveries.offeringId,
      ),
    )
    .leftJoin(
      courses,
      eq(courses.id, courseOfferings.courseId),
    )
    .leftJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        sectionScheduleEvents.facultyMembershipId,
      ),
    )
    .leftJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      eq(
        sectionScheduleEvents.sectionId,
        sectionId,
      ),
    )
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
    );
}

export async function createSectionScheduleEvent(
  context: RequestContext,
  rawInput: CreateSectionScheduleEventInput,
) {
  const input =
    createSectionScheduleEventInputSchema.parse(
      rawInput,
    );
  const section = await loadSectionScope(
    input.sectionId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  const period =
    await loadAcademicPeriodScope(
      section.academicPeriodId,
    );

  if (period.status === "CLOSED") {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  await Promise.all([
    validateFacultyForSection(
      input.facultyMembershipId,
      section.collegeId,
    ),
    validateDeliveryForSection(
      input.deliveryId,
      input.sectionId,
    ),
  ]);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  eventWindowInsidePeriod(
    startsAt,
    endsAt,
    period,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(sectionScheduleEvents)
      .values({
        sectionId: input.sectionId,
        facultyMembershipId:
          input.facultyMembershipId ?? null,
        title: input.title,
        description: input.description ?? null,
        startsAt,
        endsAt,
        location: input.location ?? null,
      })
      .returning();

    if (input.deliveryId) {
      await tx
        .insert(sectionScheduleEventCourses)
        .values({
          scheduleEventId: created!.id,
          deliveryId: input.deliveryId,
        });
    }

    return created!;
  });
}

export async function updateSectionScheduleEvent(
  context: RequestContext,
  eventIdInput: string,
  rawInput: UpdateSectionScheduleEventInput,
) {
  const eventId =
    scheduleEventIdSchema.parse(eventIdInput);
  const input =
    updateSectionScheduleEventInputSchema.parse(
      rawInput,
    );
  const scope =
    await loadScheduleEventScope(eventId);

  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  if (scope.status !== "SCHEDULED") {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_NOT_FOUND",
    );
  }

  const period =
    await loadAcademicPeriodScope(
      scope.academicPeriodId,
    );

  if (period.status === "CLOSED") {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  await Promise.all([
    input.facultyMembershipId !== undefined
      ? validateFacultyForSection(
          input.facultyMembershipId,
          scope.collegeId,
        )
      : Promise.resolve(),
    input.deliveryId !== undefined
      ? validateDeliveryForSection(
          input.deliveryId,
          scope.sectionId,
        )
      : Promise.resolve(),
  ]);

  const startsAt = input.startsAt
    ? new Date(input.startsAt)
    : scope.startsAt;
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : scope.endsAt;

  eventWindowInsidePeriod(
    startsAt,
    endsAt,
    period,
  );

  const db = getDb();

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(sectionScheduleEvents)
      .set({
        ...(input.facultyMembershipId !==
        undefined
          ? {
              facultyMembershipId:
                input.facultyMembershipId,
            }
          : {}),
        ...(input.title !== undefined
          ? { title: input.title }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.startsAt !== undefined
          ? { startsAt }
          : {}),
        ...(input.endsAt !== undefined
          ? { endsAt }
          : {}),
        ...(input.location !== undefined
          ? { location: input.location }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sectionScheduleEvents.id, eventId),
          eq(
            sectionScheduleEvents.status,
            "SCHEDULED",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "SCHEDULE_EVENT_NOT_FOUND",
      );
    }

    if (input.deliveryId !== undefined) {
      await tx
        .delete(sectionScheduleEventCourses)
        .where(
          eq(
            sectionScheduleEventCourses.scheduleEventId,
            eventId,
          ),
        );

      if (input.deliveryId) {
        await tx
          .insert(sectionScheduleEventCourses)
          .values({
            scheduleEventId: eventId,
            deliveryId: input.deliveryId,
          });
      }
    }

    return updated;
  });
}

export async function cancelSectionScheduleEvent(
  context: RequestContext,
  eventIdInput: string,
  rawInput: unknown,
) {
  const eventId =
    scheduleEventIdSchema.parse(eventIdInput);
  scheduleEventTransitionSchema.parse(rawInput);
  const scope =
    await loadScheduleEventScope(eventId);

  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  if (scope.status !== "SCHEDULED") {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_NOT_FOUND",
    );
  }

  const db = getDb();
  const [updated] = await db
    .update(sectionScheduleEvents)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sectionScheduleEvents.id, eventId),
        eq(
          sectionScheduleEvents.status,
          "SCHEDULED",
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new AcademicsServiceError(
      "SCHEDULE_EVENT_NOT_FOUND",
    );
  }

  return updated;
}
