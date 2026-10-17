import "server-only";

import {
  and,
  asc,
  eq,
  inArray,
  gte,
  lt,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendancePolicies,
  attendanceRecords,
  attendanceSessions,
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";
import {
  learnerAttendanceStatus,
  summarizeLearnerAttendance,
  type LearnerAttendanceRow,
} from "./model";

const DEFAULT_POLICY = {
  eligibilityThresholdPercent: 75,
  correctionWindowHours: 24,
} as const;

function requireLearner(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError(
      "academics.read",
    );
  }

  return context.membership;
}

export async function getLearnerAttendanceWorkspace(
  context: RequestContext,
  options: {
    includeHistorical?: boolean;
    /** Trusted server-side half-open IST calendar window. */
    window?: { from: Date; to: Date };
  } = {},
) {
  const membership = requireLearner(context);
  if (
    context.user.platformStatus !== "ACTIVE" ||
    membership.status !== "ACTIVE"
  ) {
    throw new AuthorizationError("academics.read");
  }
  // A forged college/membership pair must be denied, not rendered as an
  // empty attendance workspace.
  const [persisted] = await getDb()
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .where(
      and(
        eq(collegeMemberships.id, membership.id),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.collegeId, membership.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);
  if (!persisted) {
    throw new AuthorizationError("academics.read");
  }
  const deliveries =
    await listLearnerCourseDeliveries(
      context,
      {
        includeHistorical:
          options.includeHistorical ?? false,
      },
    );

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
        membership.collegeId,
      ),
    )
    .limit(1);

  if (deliveries.length === 0) {
    return {
      policy: policy ?? DEFAULT_POLICY,
      courses: [],
      records: [],
      overall:
        summarizeLearnerAttendance([]),
      summaries: [],
    };
  }

  const deliveryIds = deliveries.map(
    (delivery) => delivery.deliveryId,
  );
  const rows = await getDb()
    .select({
      id: sectionScheduleEvents.id,
      deliveryId:
        sectionScheduleEventCourses.deliveryId,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      sectionName: sections.name,
      title: sectionScheduleEvents.title,
      startsAt:
        sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location:
        sectionScheduleEvents.location,
      facultyName: users.displayName,
      sessionStatus:
        attendanceSessions.status,
      recordStatus:
        attendanceRecords.status,
      markedAt:
        attendanceRecords.markedAt,
    })
    .from(sectionScheduleEventCourses)
    .innerJoin(
      sectionScheduleEvents,
      and(
        eq(
          sectionScheduleEvents.id,
          sectionScheduleEventCourses.scheduleEventId,
        ),
        eq(
          sectionScheduleEvents.status,
          "SCHEDULED",
        ),
      ),
    )
    .innerJoin(
      courseSectionDeliveries,
      eq(
        courseSectionDeliveries.id,
        sectionScheduleEventCourses.deliveryId,
      ),
    )
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
      sections,
      eq(
        sections.id,
        sectionScheduleEvents.sectionId,
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
      attendanceRecords,
      and(
        eq(
          attendanceRecords.scheduleEventId,
          sectionScheduleEvents.id,
        ),
        eq(
          attendanceRecords.membershipId,
          membership.id,
        ),
      ),
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
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .where(
      and(
        inArray(sectionScheduleEventCourses.deliveryId, deliveryIds),
        ...(options.window ? [
          lt(sectionScheduleEvents.startsAt, options.window.to),
          gte(sectionScheduleEvents.endsAt, options.window.from),
        ] : []),
      ),
    )
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
    );

  const records: LearnerAttendanceRow[] =
    rows.map((row) => ({
      ...row,
      deliveryId: row.deliveryId!,
      courseId: row.courseId!,
      courseName: row.courseName!,
      courseCode: row.courseCode!,
      sessionStatus:
        row.sessionStatus as LearnerAttendanceRow["sessionStatus"],
      recordStatus:
        row.recordStatus as LearnerAttendanceRow["recordStatus"],
    }));

  const courseList = deliveries.map(
    (delivery) => ({
      deliveryId: delivery.deliveryId,
      courseId: delivery.courseId,
      courseName: delivery.courseName,
      courseCode: delivery.courseCode,
      sectionName: delivery.sectionName,
      academicPeriodName:
        delivery.academicPeriodName,
    }),
  );

  const summaries = courseList.map(
    (course) => {
      const courseRows = records.filter(
        (record) =>
          record.deliveryId ===
          course.deliveryId,
      );
      return {
        ...course,
        ...summarizeLearnerAttendance(
          courseRows,
        ),
      };
    },
  );

  return {
    policy: policy ?? DEFAULT_POLICY,
    courses: courseList,
    records: records.map((record) => ({
      ...record,
      status:
        learnerAttendanceStatus(record),
    })),
    overall:
      summarizeLearnerAttendance(records),
    summaries,
  };
}
