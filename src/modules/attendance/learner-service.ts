import "server-only";

import {
  and,
  asc,
  eq,
  inArray,
  lte,
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
) {
  const membership = requireLearner(context);
  const deliveries =
    await listLearnerCourseDeliveries(context);

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
  const now = new Date();

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
        lte(
          sectionScheduleEvents.startsAt,
          now,
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
      inArray(
        sectionScheduleEventCourses.deliveryId,
        deliveryIds,
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
