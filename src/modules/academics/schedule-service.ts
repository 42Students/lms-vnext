import {
  and,
  asc,
  eq,
  gt,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { z } from "zod";
import {
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  lectureHalls,
  sections,
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
    `${period.startDate}T00:00:00+05:30`,
  ).getTime();
  const periodEndExclusive =
    new Date(
      `${period.endDate}T00:00:00+05:30`,
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

type ScheduleTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

function requestedHallId(value: unknown): string | null | undefined {
  // Existing typed callers may omit this optional hall ID, but raw API bodies
  // can supply it. Never accept an unchecked cross-college hall reference.
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return z.string().uuid().nullable().optional()
    .parse((value as Record<string, unknown>).lectureHallId);
}

async function assertScheduleResources(tx: ScheduleTx, input: {
  collegeId: string;
  sectionId: string;
  facultyMembershipId: string | null;
  lectureHallId: string | null;
  startsAt: Date;
  endsAt: Date;
  exceptEventId?: string;
}) {
  // Transaction-scoped college lock serializes schedule edits across sections
  // and faculty. A hash collision may add waiting, never grant data access.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.collegeId}))`);

  if (input.lectureHallId) {
    // Parent lock prevents a concurrent archive from racing this booking.
    const [hall] = await tx.select({ capacity: lectureHalls.capacity })
      .from(lectureHalls)
      .where(and(eq(lectureHalls.id, input.lectureHallId),
        eq(lectureHalls.collegeId, input.collegeId),
        eq(lectureHalls.status, "ACTIVE")))
      .for("update").limit(1);
    if (!hall) throw new AcademicsServiceError("SCHEDULE_HALL_NOT_FOUND");
    const [section] = await tx.select({ capacity: sections.capacity })
      .from(sections).where(eq(sections.id, input.sectionId)).limit(1);
    if (section?.capacity !== null && section?.capacity !== undefined &&
        section.capacity > hall.capacity) {
      throw new AcademicsServiceError("SCHEDULE_HALL_CAPACITY_CONFLICT");
    }
  }

  const resources = [eq(sectionScheduleEvents.sectionId, input.sectionId)];
  if (input.facultyMembershipId) {
    resources.push(eq(sectionScheduleEvents.facultyMembershipId, input.facultyMembershipId));
  }
  if (input.lectureHallId) {
    resources.push(eq(sectionScheduleEvents.lectureHallId, input.lectureHallId));
  }
  const [overlap] = await tx.select({
    sectionId: sectionScheduleEvents.sectionId,
    facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
    lectureHallId: sectionScheduleEvents.lectureHallId,
  }).from(sectionScheduleEvents)
    .where(and(
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      lt(sectionScheduleEvents.startsAt, input.endsAt),
      gt(sectionScheduleEvents.endsAt, input.startsAt),
      or(...resources),
      ...(input.exceptEventId
        ? [ne(sectionScheduleEvents.id, input.exceptEventId)] : []),
    )).limit(1);
  if (!overlap) return;
  if (overlap.sectionId === input.sectionId) {
    throw new AcademicsServiceError("SCHEDULE_SECTION_CONFLICT");
  }
  if (input.facultyMembershipId && overlap.facultyMembershipId === input.facultyMembershipId) {
    throw new AcademicsServiceError("SCHEDULE_FACULTY_CONFLICT");
  }
  throw new AcademicsServiceError("SCHEDULE_HALL_CONFLICT");
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
      lectureHallId: sectionScheduleEvents.lectureHallId,
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
  const lectureHallId = requestedHallId(rawInput);
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
    await assertScheduleResources(tx, {
      collegeId: section.collegeId,
      sectionId: input.sectionId,
      facultyMembershipId: input.facultyMembershipId ?? null,
      lectureHallId: lectureHallId ?? null,
      startsAt, endsAt,
    });
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
        lectureHallId: lectureHallId ?? null,
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
  const requestedRoom = requestedHallId(rawInput);
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

  const db = getDb();

  return db.transaction(async (tx) => {
    // Lock the event before deriving unchanged resource fields, preventing a
    // concurrent edit from silently reverting faculty/time/room changes.
    const [current] = await tx.select({
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
      lectureHallId: sectionScheduleEvents.lectureHallId,
      status: sectionScheduleEvents.status,
    }).from(sectionScheduleEvents)
      .where(eq(sectionScheduleEvents.id, eventId))
      .for("update").limit(1);
    if (!current || current.status !== "SCHEDULED") {
      throw new AcademicsServiceError("SCHEDULE_EVENT_NOT_FOUND");
    }
    const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : current.endsAt;
    eventWindowInsidePeriod(startsAt, endsAt, period);
    await assertScheduleResources(tx, {
      collegeId: scope.collegeId,
      sectionId: scope.sectionId,
      facultyMembershipId: input.facultyMembershipId === undefined
        ? current.facultyMembershipId : input.facultyMembershipId,
      lectureHallId: requestedRoom === undefined
        ? current.lectureHallId : requestedRoom,
      startsAt, endsAt, exceptEventId: eventId,
    });
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
        ...(requestedRoom !== undefined
          ? { lectureHallId: requestedRoom }
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
