import "server-only";

import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  attendancePolicies,
  attendanceRecords,
  attendanceSessions,
  collegeMemberships,
  courseTeachingAssignments,
  electiveOfferings,
  electiveSlots,
  learnerProgramEnrollments,
  learnerProfiles,
  lmsGroupMembers,
  lmsGroups,
  membershipRoles,
  sectionEnrollments,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "@/modules/courses/errors";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";

const uuid = z.string().uuid();
const sessionInputSchema = z
  .object({
    deliveryId: uuid,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4000).nullable().optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    location: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      new Date(value.endsAt).getTime() >
      new Date(value.startsAt).getTime(),
    {
      path: ["endsAt"],
      message: "Session end must be after start",
    },
  );

const bulkInputSchema = z
  .object({
    deliveryId: uuid,
    absentMembershipIds: z.array(uuid).max(1000).default([]),
    presentMembershipIds: z.array(uuid).max(1000).default([]),
  })
  .superRefine((value, ctx) => {
    const absent = new Set(value.absentMembershipIds);
    const present = new Set(value.presentMembershipIds);
    if (absent.size !== value.absentMembershipIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["absentMembershipIds"],
        message: "Absent learners must be unique",
      });
    }
    if (present.size !== value.presentMembershipIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["presentMembershipIds"],
        message: "Present learners must be unique",
      });
    }
    for (const id of absent) {
      if (present.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["presentMembershipIds"],
          message: "A learner cannot be both present and absent",
        });
        break;
      }
    }
  });

type FacultyDelivery = Awaited<
  ReturnType<typeof listFacultyCourseDeliveries>
>[number];

const DEFAULT_POLICY = {
  eligibilityThresholdPercent: 75,
  correctionWindowHours: 24,
} as const;

async function requireFacultyDelivery(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const deliveryId = uuid.parse(deliveryIdInput);
  const rows = await listFacultyCourseDeliveries(context);
  const delivery = rows.find((row) => row.deliveryId === deliveryId);
  if (!delivery) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  return delivery;
}

async function currentDeliveryRoster(
  delivery: FacultyDelivery,
  collegeId: string,
) {
  const db = getDb();
  const [elective] = await db
    .select({
      groupId: electiveOfferings.groupId,
    })
    .from(electiveOfferings)
    .innerJoin(
      electiveSlots,
      eq(electiveSlots.id, electiveOfferings.slotId),
    )
    .innerJoin(
      lmsGroups,
      eq(lmsGroups.id, electiveOfferings.groupId),
    )
    .where(
      and(
        eq(
          electiveOfferings.backedDeliveryId,
          delivery.deliveryId,
        ),
        eq(electiveOfferings.status, "ACTIVE"),
        isNull(electiveOfferings.deletedAt),
        eq(electiveSlots.collegeId, collegeId),
        eq(electiveSlots.status, "ACTIVE"),
        isNull(electiveSlots.deletedAt),
        eq(lmsGroups.collegeId, collegeId),
        eq(lmsGroups.kind, "ELECTIVE"),
        eq(lmsGroups.status, "ACTIVE"),
        isNull(lmsGroups.deletedAt),
      ),
    )
    .limit(1);

  if (elective) {
    return db
      .select({
        membershipId: collegeMemberships.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
        rollNumber: learnerProfiles.rollNumber,
      })
      .from(lmsGroupMembers)
      .innerJoin(
        collegeMemberships,
        eq(
          collegeMemberships.id,
          lmsGroupMembers.membershipId,
        ),
      )
      .innerJoin(
        membershipRoles,
        and(
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
          eq(membershipRoles.role, "LEARNER"),
        ),
      )
      .innerJoin(
        users,
        eq(users.id, collegeMemberships.userId),
      )
      .leftJoin(
        learnerProfiles,
        eq(
          learnerProfiles.membershipId,
          collegeMemberships.id,
        ),
      )
      .where(
        and(
          eq(lmsGroupMembers.groupId, elective.groupId),
          eq(lmsGroupMembers.memberType, "LEARNER"),
          eq(lmsGroupMembers.state, "ACTIVE"),
          eq(collegeMemberships.collegeId, collegeId),
          eq(collegeMemberships.status, "ACTIVE"),
          eq(users.platformStatus, "ACTIVE"),
        ),
      )
      .orderBy(asc(users.displayName), asc(users.email));
  }

  return db
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
      phoneE164: users.phoneE164,
      rollNumber: learnerProfiles.rollNumber,
    })
    .from(sectionEnrollments)
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        learnerProgramEnrollments.membershipId,
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "LEARNER"),
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .leftJoin(
      learnerProfiles,
      eq(
        learnerProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      and(
        eq(sectionEnrollments.sectionId, delivery.sectionId),
        eq(
          sectionEnrollments.academicPeriodId,
          delivery.academicPeriodId,
        ),
        eq(sectionEnrollments.status, "ACTIVE"),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .orderBy(asc(users.displayName), asc(users.email));
}

async function assertPersistedFacultyScope(
  tx: Parameters<
    Parameters<ReturnType<typeof getDb>["transaction"]>[0]
  >[0],
  context: RequestContext,
  deliveryId: string,
) {
  if (!context.membership) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  const [row] = await tx
    .select({ id: courseTeachingAssignments.id })
    .from(courseTeachingAssignments)
    .innerJoin(
      collegeMemberships,
      and(
        eq(
          collegeMemberships.id,
          courseTeachingAssignments.membershipId,
        ),
        eq(collegeMemberships.userId, context.user.id),
        eq(
          collegeMemberships.collegeId,
          context.membership.collegeId,
        ),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .where(
      and(
        eq(
          courseTeachingAssignments.deliveryId,
          deliveryId,
        ),
        eq(
          courseTeachingAssignments.membershipId,
          context.membership.id,
        ),
        isNull(courseTeachingAssignments.endedAt),
      ),
    )
    .for("share")
    .limit(1);

  if (!row || context.user.platformStatus !== "ACTIVE") {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
}

export async function getFacultyDeliveryRoster(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const delivery = await requireFacultyDelivery(
    context,
    deliveryIdInput,
  );
  if (!context.membership) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const roster = await currentDeliveryRoster(
    delivery,
    context.membership.collegeId,
  );
  return { delivery, roster };
}

export async function getFacultyAttendanceWorkspace(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const delivery = await requireFacultyDelivery(
    context,
    deliveryIdInput,
  );
  if (!context.membership) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  const [policy] = await getDb()
    .select({
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,
    })
    .from(attendancePolicies)
    .where(
      eq(
        attendancePolicies.collegeId,
        context.membership.collegeId,
      ),
    )
    .limit(1);

  const sessions = await getDb()
    .select({
      id: sectionScheduleEvents.id,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      eventStatus: sectionScheduleEvents.status,
      attendanceStatus: attendanceSessions.status,
      markedAt: attendanceSessions.markedAt,
      markedByUserId:
        attendanceSessions.markedByUserId,
    })
    .from(sectionScheduleEventCourses)
    .innerJoin(
      sectionScheduleEvents,
      eq(
        sectionScheduleEvents.id,
        sectionScheduleEventCourses.scheduleEventId,
      ),
    )
    .leftJoin(
      attendanceSessions,
      eq(
        attendanceSessions.scheduleEventId,
        sectionScheduleEvents.id,
      ),
    )
    .where(
      and(
        eq(
          sectionScheduleEventCourses.deliveryId,
          delivery.deliveryId,
        ),
        eq(
          sectionScheduleEvents.sectionId,
          delivery.sectionId,
        ),
        eq(sectionScheduleEvents.status, "SCHEDULED"),
      ),
    )
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
      asc(sectionScheduleEvents.id),
    );

  const eventIds = sessions.map((session) => session.id);
  const records =
    eventIds.length === 0
      ? []
      : await getDb()
          .select({
            id: attendanceRecords.id,
            scheduleEventId:
              attendanceRecords.scheduleEventId,
            membershipId:
              attendanceRecords.membershipId,
            status: attendanceRecords.status,
            note: attendanceRecords.note,
            markedAt: attendanceRecords.markedAt,
            displayName: users.displayName,
            email: users.email,
            phoneE164: users.phoneE164,
            rollNumber: learnerProfiles.rollNumber,
          })
          .from(attendanceRecords)
          .innerJoin(
            collegeMemberships,
            eq(
              collegeMemberships.id,
              attendanceRecords.membershipId,
            ),
          )
          .innerJoin(
            users,
            eq(users.id, collegeMemberships.userId),
          )
          .leftJoin(
            learnerProfiles,
            eq(
              learnerProfiles.membershipId,
              collegeMemberships.id,
            ),
          )
          .where(
            inArray(
              attendanceRecords.scheduleEventId,
              eventIds,
            ),
          )
          .orderBy(
            asc(users.displayName),
            asc(attendanceRecords.scheduleEventId),
          );

  const roster = await currentDeliveryRoster(
    delivery,
    context.membership.collegeId,
  );

  return {
    course: delivery,
    policy: policy ?? DEFAULT_POLICY,
    roster,
    sessions,
    records,
  };
}

export async function createFacultyAttendanceSession(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = sessionInputSchema.parse(rawInput);
  const delivery = await requireFacultyDelivery(
    context,
    input.deliveryId,
  );

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const periodStart = new Date(
    `${delivery.periodStartDate}T00:00:00.000Z`,
  ).getTime();
  const periodEndExclusive =
    new Date(
      `${delivery.periodEndDate}T00:00:00.000Z`,
    ).getTime() +
    24 * 60 * 60 * 1000;

  if (
    startsAt.getTime() < periodStart ||
    endsAt.getTime() > periodEndExclusive
  ) {
    throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
  }

  if (!context.membership) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  return getDb().transaction(async (tx) => {
    await assertPersistedFacultyScope(
      tx,
      context,
      delivery.deliveryId,
    );

    const [created] = await tx
      .insert(sectionScheduleEvents)
      .values({
        sectionId: delivery.sectionId,
        facultyMembershipId:
          context.membership!.id,
        title: input.title,
        description: input.description ?? null,
        startsAt,
        endsAt,
        location: input.location ?? null,
      })
      .returning();

    await tx
      .insert(sectionScheduleEventCourses)
      .values({
        scheduleEventId: created!.id,
        deliveryId: delivery.deliveryId,
      });

    return created!;
  });
}

export async function markFacultyAttendance(
  context: RequestContext,
  scheduleEventIdInput: string,
  rawInput: unknown,
) {
  const scheduleEventId = uuid.parse(
    scheduleEventIdInput,
  );
  const input = bulkInputSchema.parse(rawInput);
  const delivery = await requireFacultyDelivery(
    context,
    input.deliveryId,
  );
  if (!context.membership) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  const roster = await currentDeliveryRoster(
    delivery,
    context.membership.collegeId,
  );
  const rosterIds = new Set(
    roster.map((row) => row.membershipId),
  );
  const submitted = new Set([
    ...input.absentMembershipIds,
    ...input.presentMembershipIds,
  ]);
  if (
    rosterIds.size !== submitted.size ||
    [...rosterIds].some((id) => !submitted.has(id))
  ) {
    throw new CoursesServiceError(
      "ATTENDANCE_ROSTER_CONFLICT",
    );
  }

  return getDb().transaction(async (tx) => {
    await assertPersistedFacultyScope(
      tx,
      context,
      delivery.deliveryId,
    );

    const [event] = await tx
      .select({
        id: sectionScheduleEvents.id,
        sectionId: sectionScheduleEvents.sectionId,
        status: sectionScheduleEvents.status,
        deliveryId:
          sectionScheduleEventCourses.deliveryId,
      })
      .from(sectionScheduleEvents)
      .innerJoin(
        sectionScheduleEventCourses,
        eq(
          sectionScheduleEventCourses.scheduleEventId,
          sectionScheduleEvents.id,
        ),
      )
      .where(
        eq(
          sectionScheduleEvents.id,
          scheduleEventId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !event ||
      event.status !== "SCHEDULED" ||
      event.deliveryId !== delivery.deliveryId ||
      event.sectionId !== delivery.sectionId
    ) {
      throw new AcademicsServiceError(
        "SCHEDULE_EVENT_NOT_FOUND",
      );
    }

    const now = new Date();

    if (input.presentMembershipIds.length > 0) {
      await tx
        .delete(attendanceRecords)
        .where(
          and(
            eq(
              attendanceRecords.scheduleEventId,
              scheduleEventId,
            ),
            inArray(
              attendanceRecords.membershipId,
              input.presentMembershipIds,
            ),
          ),
        );
    }

    if (input.absentMembershipIds.length > 0) {
      await tx
        .delete(attendanceRecords)
        .where(
          and(
            eq(
              attendanceRecords.scheduleEventId,
              scheduleEventId,
            ),
            inArray(
              attendanceRecords.membershipId,
              input.absentMembershipIds,
            ),
          ),
        );

      await tx.insert(attendanceRecords).values(
        input.absentMembershipIds.map(
          (membershipId) => ({
            scheduleEventId,
            membershipId,
            status: "ABSENT",
            markedByUserId: context.user.id,
            markedAt: now,
            updatedAt: now,
          }),
        ),
      );
    }

    const [existingSession] = await tx
      .select({
        scheduleEventId:
          attendanceSessions.scheduleEventId,
      })
      .from(attendanceSessions)
      .where(
        eq(
          attendanceSessions.scheduleEventId,
          scheduleEventId,
        ),
      )
      .for("update")
      .limit(1);

    if (existingSession) {
      await tx
        .update(attendanceSessions)
        .set({
          status: "MARKED",
          markedByUserId: context.user.id,
          markedAt: now,
          updatedAt: now,
        })
        .where(
          eq(
            attendanceSessions.scheduleEventId,
            scheduleEventId,
          ),
        );
    } else {
      await tx.insert(attendanceSessions).values({
        scheduleEventId,
        status: "MARKED",
        markedByUserId: context.user.id,
        markedAt: now,
        updatedAt: now,
      });
    }

    return {
      scheduleEventId,
      markedAbsent:
        input.absentMembershipIds.length,
      markedPresent:
        input.presentMembershipIds.length,
      markedAt: now,
    };
  });
}
