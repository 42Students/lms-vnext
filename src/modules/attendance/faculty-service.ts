import "server-only";

import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  attendancePolicies,
  attendanceRecords,
  attendanceSessions,
  collegeMemberships,
  courseTeachingAssignments,
  courseSectionDeliveries,
  learnerProfiles,
  membershipRoles,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "@/modules/courses/errors";
import { mapFacultyScheduleInsertError } from "./faculty-schedule-errors";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";
import { listActiveDeliveryLearners } from "@/modules/courses/delivery-roster";
import { facultyAttendanceMarkingWindow } from "./faculty-marking-window";
import {facultyAttendanceCorrectionTokenMatches,facultyAttendanceNextMarkedAt}
 from "./faculty-correction-token-model";
import {facultyCorrectionDelta,facultyCorrectionReasonValid,
 facultyAttendanceChangedMemberships} from "./faculty-correction-audit-model";

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
      message: "End time must be after start time",
    },
  ).superRefine((value,ctx)=>{
    const start=Date.parse(value.startsAt),end=Date.parse(value.endsAt);
    const envMinutes=Number(process.env.FACULTY_SCHEDULE_PAST_GRACE_MINUTES??"5");
    const grace=Number.isInteger(envMinutes)&&envMinutes>=0&&envMinutes<=60?envMinutes:5;
    if(start<Date.now()-grace*60000)
      ctx.addIssue({code:"custom",path:["startsAt"],message:"Cannot schedule a class in the past"});
    if(end-start>12*60*60*1000)
      ctx.addIssue({code:"custom",path:["endsAt"],message:"A class can be at most 12 hours. Check AM/PM."});
  });

const bulkInputSchema = z
  .object({
    deliveryId: uuid,
    absentMembershipIds: z.array(uuid).max(1000).default([]),
    presentMembershipIds: z.array(uuid).max(1000).default([]),
    expectedMarkedAt:z.string().datetime({offset:true}).nullable().optional(),
    correctionReason:z.string().trim().max(500).optional(),
  })
  .strict()
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
  return listActiveDeliveryLearners({
    deliveryId: delivery.deliveryId,
    sectionId: delivery.sectionId,
    academicPeriodId:
      delivery.academicPeriodId,
    collegeId,
  });
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
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .innerJoin(courseSectionDeliveries, and(
      eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
      isNull(courseSectionDeliveries.endedAt),
    ))
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
      facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      eventStatus: sectionScheduleEvents.status,
      updatedAt: sectionScheduleEvents.updatedAt,
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

  try {
    return await getDb().transaction(async (tx) => {
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

      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CLASS_SCHEDULED,
        collegeId: context.membership!.collegeId,
        organizationId: context.membership!.organizationId,
        subjectType: "attendance_session",
        subjectId: created!.id,
        summary: "Faculty class session scheduled",
        metadata: { deliveryId: delivery.deliveryId,
          startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
        groupKey: "attendance-session:" + created!.id,
        dedupeKey: "faculty-class:" + created!.id + ":scheduled",
      });
      return created!;
    });
  } catch (error) {
    throw mapFacultyScheduleInsertError(error);
  }
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
        startsAt: sectionScheduleEvents.startsAt,
        endsAt: sectionScheduleEvents.endsAt,
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

    const [policy] = await tx.select({
      correctionWindowHours: attendancePolicies.correctionWindowHours,
    }).from(attendancePolicies).where(
      eq(attendancePolicies.collegeId, context.membership!.collegeId),
    ).limit(1);
    const now = new Date();
    const window = facultyAttendanceMarkingWindow({
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      correctionWindowHours: policy?.correctionWindowHours ?? DEFAULT_POLICY.correctionWindowHours,
      now,
    });
    if (window !== "OPEN") {
      throw new CoursesServiceError(window === "NOT_STARTED"
        ? "ATTENDANCE_NOT_STARTED" : "ATTENDANCE_CORRECTION_WINDOW_EXPIRED");
    }

    const [existingSession] = await tx.select({
      scheduleEventId:attendanceSessions.scheduleEventId,
      status:attendanceSessions.status,
      markedAt:attendanceSessions.markedAt,
    }).from(attendanceSessions).where(eq(attendanceSessions.scheduleEventId,scheduleEventId))
      .for("update").limit(1);
    if(!facultyAttendanceCorrectionTokenMatches(
      existingSession?.status??null,existingSession?.markedAt??null,input.expectedMarkedAt,
    ))throw new CoursesServiceError("ATTENDANCE_STALE_VERSION");
    const isCorrection=existingSession?.status==="MARKED";
    if(isCorrection&&!facultyCorrectionReasonValid(input.correctionReason))
      throw new CoursesServiceError("ATTENDANCE_CORRECTION_REASON_REQUIRED");
    const oldAbsent=isCorrection?await tx.select({membershipId:attendanceRecords.membershipId})
      .from(attendanceRecords).where(and(
        eq(attendanceRecords.scheduleEventId,scheduleEventId),
        eq(attendanceRecords.status,"ABSENT"),
      )):[];
    const delta=facultyCorrectionDelta(oldAbsent.map(row=>row.membershipId),input.absentMembershipIds);
    const notificationChanges=facultyAttendanceChangedMemberships(
      oldAbsent.map(row=>row.membershipId),input.absentMembershipIds);
    if(isCorrection&&!delta.changed)throw new CoursesServiceError("ATTENDANCE_CORRECTION_NO_CHANGE");
    const writtenAt=facultyAttendanceNextMarkedAt(now,existingSession?.markedAt??null);

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

    if (existingSession) {
      const [changed]=await tx
        .update(attendanceSessions)
        .set({
          status: "MARKED",
          markedByUserId: context.user.id,
          markedAt: writtenAt,
          updatedAt: writtenAt,
        })
        .where(and(
          eq(attendanceSessions.scheduleEventId,scheduleEventId),
          existingSession.status==="MARKED"?
            sql`date_trunc('milliseconds', ${attendanceSessions.markedAt}) =
              ${new Date(input.expectedMarkedAt!).toISOString()}::timestamptz`:undefined,
        )).returning({id:attendanceSessions.scheduleEventId});
      if(!changed)throw new CoursesServiceError("ATTENDANCE_STALE_VERSION");
    } else {
      await tx.insert(attendanceSessions).values({
        scheduleEventId,
        status: "MARKED",
        markedByUserId: context.user.id,
        markedAt: writtenAt,
        updatedAt: writtenAt,
      });
    }

    // A correction may remove the last absence row; retain the history
    // independently of the current absence-only record representation.
    // Counts and scope are safe audit metadata; omit private learner identities.
    const activity=await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_ATTENDANCE_MARKED,
      collegeId: context.membership!.collegeId,
      organizationId: context.membership!.organizationId,
      subjectType: "attendance_session",
      subjectId: scheduleEventId,
      subjectLabel: event.id,
      summary: existingSession ? "Class attendance corrected" : "Class attendance marked",
      metadata: {
        deliveryId: delivery.deliveryId,
        markedAbsent: input.absentMembershipIds.length,
        markedPresent: input.presentMembershipIds.length,
        correction: existingSession?.status==="MARKED",
        previousMarkedAt:existingSession?.markedAt?.toISOString()??null,
        markedAt:writtenAt.toISOString(),
        correctionReason:isCorrection?input.correctionReason:null,
        movedToAbsent:delta.movedToAbsent,
        movedToPresent:delta.movedToPresent,
      },
      groupKey: `attendance-session:${scheduleEventId}`,
    });

    // FAC-attendance-grades-01: only learners whose status changed get a notice.
    // Resolve recipients from current, active membership rows inside this write
    // transaction. Do not put names, roll numbers or parent numbers in the event.
    const changedIds=[...notificationChanges.newlyAbsent,...notificationChanges.correctedPresent];
    if(changedIds.length){
      const targets=await tx.select({
        membershipId:collegeMemberships.id,userId:collegeMemberships.userId,
      }).from(collegeMemberships)
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .where(and(
          inArray(collegeMemberships.id,changedIds),
          eq(collegeMemberships.collegeId,context.membership!.collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
          eq(users.platformStatus,"ACTIVE"),
        ));
      const idToUser=new Map(targets.map(row=>[row.membershipId,row.userId]));
      const notify=async (ids:readonly string[],title:string,body:string)=>{
        const userIds=ids.flatMap(id=>idToUser.get(id)?[idToUser.get(id)!]:[]);
        if(userIds.length)await deliverInAppNotificationInTransaction(tx,activity.id,userIds,{
          title,body,actionHref:"/learn/courses",
        });
      };
      await notify(notificationChanges.newlyAbsent,
        "Class attendance marked absent",
        "You were marked absent for a scheduled class. Open Courses to review your attendance.");
      await notify(notificationChanges.correctedPresent,
        "Class attendance corrected",
        "A previous absence was corrected to present. Open Courses to review your attendance.");
    }

    return {
      scheduleEventId,
      markedAbsent:
        input.absentMembershipIds.length,
      markedPresent:
        input.presentMembershipIds.length,
      markedAt: writtenAt,
    };
  });
}
