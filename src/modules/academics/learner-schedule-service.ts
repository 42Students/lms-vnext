import "server-only";

import { z } from "zod";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  lt,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  collegeMemberships,
  membershipRoles,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  learnerProgramEnrollments,
  sectionEnrollments,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AcademicsServiceError } from "./errors";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listLearnerCourseDeliveries } from "@/modules/courses/learner-course-service";

function requireLearnerMembership(
  context: RequestContext,
) {
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes("LEARNER")
  ) {
    throw new AcademicsServiceError(
      "LEARNER_SCHEDULE_ACCESS_DENIED",
    );
  }

  return context.membership;
}

export async function getLearnerClassSchedule(
  context: RequestContext,
  visibleWindow?:{from:Date;to:Date},
) {
  if(visibleWindow && (!Number.isFinite(visibleWindow.from.getTime()) ||
    !Number.isFinite(visibleWindow.to.getTime()) ||
    visibleWindow.to.getTime() <= visibleWindow.from.getTime() ||
    visibleWindow.to.getTime()-visibleWindow.from.getTime()>100*86_400_000))
    throw new AcademicsServiceError("INVALID_LEARNER_SCHEDULE_WINDOW");
  const membership =
    requireLearnerMembership(context);
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  const db = getDb();
  // Never trust stale/forged context claims in read-only schedule delivery.
  const [actor] = await db.select({
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    userStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, z.string().uuid().parse(membership.id)))
    .limit(1);
  if (!actor || actor.userId !== context.user.id ||
      actor.collegeId !== membership.collegeId || actor.status !== "ACTIVE" ||
      actor.userStatus !== "ACTIVE") {
    throw new AuthorizationError("academics.read");
  }

  const placements = await db
    .select({
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      academicPeriodId: academicPeriods.id,
      academicPeriodName: academicPeriods.name,
      periodStartDate: academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      periodStatus: academicPeriods.status,
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
      sections,
      eq(sections.id, sectionEnrollments.sectionId),
    )
    .innerJoin(
      academicPeriods,
      eq(
        academicPeriods.id,
        sectionEnrollments.academicPeriodId,
      ),
    )
    .where(
      and(
        eq(
          learnerProgramEnrollments.membershipId,
          membership.id,
        ),
        eq(
          learnerProgramEnrollments.status,
          "ACTIVE",
        ),
        eq(sectionEnrollments.status, "ACTIVE"),
        eq(sections.status, "ACTIVE"),
        inArray(academicPeriods.status, [
          "PLANNED",
          "ACTIVE",
        ]),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(sections.name),
    );

  // The course roster is the canonical union of primary-section learners and
  // ACTIVE group-backed elective memberships. Never infer elective access from
  // the host section alone.
  const accessible = await listLearnerCourseDeliveries(context);
  const deliveryIds = [...new Set(accessible.map(course => course.deliveryId))];
  const coursesList = [...new Map(accessible.map(course => [
    course.deliveryId,
    { deliveryId: course.deliveryId, sectionId: course.sectionId,
      courseId: course.courseId, courseName: course.courseName,
      courseCode: course.courseCode },
  ])).values()].sort((a, b) => a.courseName.localeCompare(b.courseName));
  if (placements.length === 0 && deliveryIds.length === 0)
    return { sections: [], courses: [], events: [] };

  const primarySectionIds = placements.map(row => row.sectionId);
  const authorizedLink = deliveryIds.length
    ? inArray(sectionScheduleEventCourses.deliveryId, deliveryIds)
    : sql<boolean>`false`;

  const events = await db
    .select({
      id: sectionScheduleEvents.id,
      sectionId: sectionScheduleEvents.sectionId,
      sectionName: sections.name,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      facultyName: users.displayName,
      deliveryId: sectionScheduleEventCourses.deliveryId,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(sectionScheduleEvents)
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .leftJoin(
      sectionScheduleEventCourses,
      eq(sectionScheduleEventCourses.scheduleEventId, sectionScheduleEvents.id),
    )
    .leftJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, sectionScheduleEventCourses.deliveryId))
    .leftJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .leftJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(collegeMemberships, eq(collegeMemberships.id, sectionScheduleEvents.facultyMembershipId))
    .leftJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      ...(visibleWindow?[
        lt(sectionScheduleEvents.startsAt,visibleWindow.to),
        gte(sectionScheduleEvents.endsAt,visibleWindow.from),
      ]:[]),
      or(
        and(
          inArray(sectionScheduleEvents.sectionId, primarySectionIds),
          or(isNull(sectionScheduleEventCourses.deliveryId), authorizedLink),
        ),
        // Elective events in a host section outside the learner's primary
        // sections appear only when linked to a delivery they can access.
        authorizedLink,
      ),
    ))
    .orderBy(asc(sectionScheduleEvents.startsAt));

  return { sections: placements, courses: coursesList, events };
}
