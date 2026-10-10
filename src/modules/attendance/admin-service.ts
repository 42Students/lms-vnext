import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  attendancePolicies,
  attendanceRecords,
  attendanceSessions,
  colleges,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  departments,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import {
  listActiveDeliveryLearners,
} from "@/modules/courses/delivery-roster";
import { indiaAttendanceMonthWindow } from "./month-window";

const uuid = z.string().uuid();
const correctionSchema = z.object({
  collegeId: uuid,
  deliveryId: uuid,
  membershipId: uuid,
  status: z.enum([
    "PRESENT",
    "ABSENT",
    "EXCUSED",
    "MEDICAL",
    "LATE",
  ]),
});

async function requireAttendanceCollege(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = uuid.parse(collegeIdInput);

  if (isSuperAdmin(context)) {
    if (
      !context.adminScope?.collegeId ||
      context.adminScope.collegeId !== collegeId
    ) {
      throw new CoursesServiceError(
        "LEARNING_ACCESS_DENIED",
      );
    }
  } else if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    ) ||
    context.membership.collegeId !== collegeId
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const [college] = await getDb()
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
    })
    .from(colleges)
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  requirePermission(
    context,
    "academics.manage",
    {
      organizationId: college.organizationId,
      collegeId: college.id,
    },
  );

  return college;
}

export async function getAdminAttendanceOptions(
  context: RequestContext,
  collegeIdInput: string,
) {
  const college =
    await requireAttendanceCollege(
      context,
      collegeIdInput,
    );

  const [policyRows, deliveries] =
    await Promise.all([
      getDb()
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
            college.id,
          ),
        )
        .limit(1),
      getDb()
        .select({
          deliveryId:
            courseSectionDeliveries.id,
          sectionId: sections.id,
          sectionName: sections.name,
          sectionCode: sections.code,
          courseId: courses.id,
          courseName: courses.name,
          courseCode: courses.code,
          academicPeriodId:
            academicPeriods.id,
          academicPeriodName:
            academicPeriods.name,
        })
        .from(courseSectionDeliveries)
        .innerJoin(
          courseOfferings,
          eq(
            courseOfferings.id,
            courseSectionDeliveries.offeringId,
          ),
        )
        .innerJoin(
          courses,
          eq(
            courses.id,
            courseOfferings.courseId,
          ),
        )
        .innerJoin(
          departments,
          and(
            eq(
              departments.id,
              courses.departmentId,
            ),
            eq(
              departments.collegeId,
              college.id,
            ),
          ),
        )
        .innerJoin(
          sections,
          eq(
            sections.id,
            courseSectionDeliveries.sectionId,
          ),
        )
        .innerJoin(
          academicPeriods,
          eq(
            academicPeriods.id,
            courseOfferings.academicPeriodId,
          ),
        )
        .where(
          and(
            isNull(
              courseSectionDeliveries.endedAt,
            ),
            eq(courseOfferings.status, "ACTIVE"),
            eq(courses.status, "ACTIVE"),
            eq(sections.status, "ACTIVE"),
          ),
        )
        .orderBy(
          asc(sections.name),
          asc(courses.name),
          asc(courseSectionDeliveries.id),
        ),
    ]);

  return {
    college,
    policy:
      policyRows[0] ?? {
        eligibilityThresholdPercent: 75,
        correctionWindowHours: 24,
      },
    deliveries,
  };
}

async function requireAdminDelivery(
  context: RequestContext,
  collegeIdInput: string,
  deliveryIdInput: string,
) {
  const options =
    await getAdminAttendanceOptions(
      context,
      collegeIdInput,
    );
  const deliveryId =
    uuid.parse(deliveryIdInput);
  const delivery =
    options.deliveries.find(
      (item) =>
        item.deliveryId === deliveryId,
    );

  if (!delivery) {
    throw new CoursesServiceError(
      "CONTENT_DELIVERY_MISMATCH",
    );
  }

  return {
    ...options,
    delivery,
  };
}

export async function getAdminAttendanceGrid(
  context: RequestContext,
  rawInput: {
    collegeId: string;
    deliveryId: string;
    month: string;
  },
) {
  const { college, policy, delivery } =
    await requireAdminDelivery(
      context,
      rawInput.collegeId,
      rawInput.deliveryId,
    );
  const window = indiaAttendanceMonthWindow(rawInput.month);

  const sessions = await getDb()
    .select({
      id: sectionScheduleEvents.id,
      title: sectionScheduleEvents.title,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      attendanceStatus:
        attendanceSessions.status,
      attendanceMarkedAt:
        attendanceSessions.markedAt,
      attendanceMarkedByUserId:
        attendanceSessions.markedByUserId,
      attendanceMarkedByName:
        users.displayName,
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
    .leftJoin(
      users,
      eq(
        users.id,
        attendanceSessions.markedByUserId,
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
        eq(
          sectionScheduleEvents.status,
          "SCHEDULED",
        ),
        gte(
          sectionScheduleEvents.startsAt,
          window.start,
        ),
        lt(
          sectionScheduleEvents.startsAt,
          window.end,
        ),
      ),
    )
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
      asc(sectionScheduleEvents.id),
    );

  const roster =
    await listActiveDeliveryLearners({
      deliveryId: delivery.deliveryId,
      sectionId: delivery.sectionId,
      academicPeriodId:
        delivery.academicPeriodId,
      collegeId: college.id,
    });

  const records =
    sessions.length === 0
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
            markedByUserId:
              attendanceRecords.markedByUserId,
            markedByName:
              users.displayName,
            markedAt:
              attendanceRecords.markedAt,
          })
          .from(attendanceRecords)
          .innerJoin(
            users,
            eq(
              users.id,
              attendanceRecords.markedByUserId,
            ),
          )
          .where(
            // The unique delivery/Section session list is tenant-authorized
            // above; constrain records to those exact sessions.
            inArray(
              attendanceRecords.scheduleEventId,
              sessions.map(
                (session) => session.id,
              ),
            ),
          );

  return {
    college,
    policy,
    delivery,
    month: window.month,
    roster,
    sessions,
    records,
  };
}

export async function correctAdminAttendance(
  context: RequestContext,
  scheduleEventIdInput: string,
  rawInput: unknown,
) {
  const scheduleEventId =
    uuid.parse(scheduleEventIdInput);
  const input =
    correctionSchema.parse(rawInput);
  const { college, delivery } =
    await requireAdminDelivery(
      context,
      input.collegeId,
      input.deliveryId,
    );

  const roster =
    await listActiveDeliveryLearners({
      deliveryId: delivery.deliveryId,
      sectionId: delivery.sectionId,
      academicPeriodId:
        delivery.academicPeriodId,
      collegeId: college.id,
    });
  if (
    !roster.some(
      (row) =>
        row.membershipId ===
        input.membershipId,
    )
  ) {
    throw new CoursesServiceError(
      "ATTENDANCE_ROSTER_CONFLICT",
    );
  }

  return getDb().transaction(
    async (tx) => {
      const [event] = await tx
        .select({
          id: sectionScheduleEvents.id,
          sectionId:
            sectionScheduleEvents.sectionId,
          deliveryId:
            sectionScheduleEventCourses.deliveryId,
          status:
            sectionScheduleEvents.status,
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
        event.sectionId !==
          delivery.sectionId ||
        event.deliveryId !==
          delivery.deliveryId
      ) {
        throw new CoursesServiceError(
          "CONTENT_DELIVERY_MISMATCH",
        );
      }

      const now = new Date();

      if (input.status === "PRESENT") {
        await tx
          .delete(attendanceRecords)
          .where(
            and(
              eq(
                attendanceRecords.scheduleEventId,
                scheduleEventId,
              ),
              eq(
                attendanceRecords.membershipId,
                input.membershipId,
              ),
            ),
          );
      } else {
        const [existing] = await tx
          .select({ id: attendanceRecords.id })
          .from(attendanceRecords)
          .where(
            and(
              eq(
                attendanceRecords.scheduleEventId,
                scheduleEventId,
              ),
              eq(
                attendanceRecords.membershipId,
                input.membershipId,
              ),
            ),
          )
          .for("update")
          .limit(1);

        if (existing) {
          await tx
            .update(attendanceRecords)
            .set({
              status: input.status,
              markedByUserId:
                context.user.id,
              markedAt: now,
              updatedAt: now,
            })
            .where(
              eq(
                attendanceRecords.id,
                existing.id,
              ),
            );
        } else {
          await tx
            .insert(attendanceRecords)
            .values({
              scheduleEventId,
              membershipId:
                input.membershipId,
              status: input.status,
              markedByUserId:
                context.user.id,
              markedAt: now,
              updatedAt: now,
            });
        }
      }

      const [session] = await tx
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

      if (session) {
        await tx
          .update(attendanceSessions)
          .set({
            status: "MARKED",
            markedByUserId:
              context.user.id,
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
        await tx
          .insert(attendanceSessions)
          .values({
            scheduleEventId,
            status: "MARKED",
            markedByUserId:
              context.user.id,
            markedAt: now,
            updatedAt: now,
          });
      }

      return {
        scheduleEventId,
        membershipId: input.membershipId,
        status: input.status,
        correctedAt: now,
      };
    },
  );
}
