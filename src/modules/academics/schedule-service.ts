import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  sectionScheduleEvents,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
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
    .select()
    .from(sectionScheduleEvents)
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

  await validateFacultyForSection(
    input.facultyMembershipId,
    section.collegeId,
  );

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  eventWindowInsidePeriod(
    startsAt,
    endsAt,
    period,
  );

  const db = getDb();
  const [created] = await db
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

  return created;
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

  if (
    input.facultyMembershipId !== undefined
  ) {
    await validateFacultyForSection(
      input.facultyMembershipId,
      scope.collegeId,
    );
  }

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
  const [updated] = await db
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

  return updated;
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
