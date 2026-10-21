import "server-only";

import { and, asc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { listFacultyCourseDeliveries } from "./faculty-course-service";

/**
 * Faculty read-only schedule is grounded in active teaching assignments.
 * Null course links mean Section-wide events; course-linked events must belong
 * to one of the Faculty member's authorized delivery IDs.
 */
export async function getFacultyClassSchedule(
  context: RequestContext,
  options: { startAt?: Date; endAt?: Date } = {},
) {
  // The old calendar queried only its visible range and independently showed
  // upcoming events for the next 180 days. Bound the indexed Section query
  // rather than scanning every historical scheduled event.
  const now = new Date();
  const windowStart = options.startAt ?? new Date(now.getTime() - 366 * 86400000);
  const minimumFuture = new Date(now.getTime() + 180 * 86400000);
  const windowEnd = options.endAt && options.endAt > minimumFuture
    ? options.endAt : minimumFuture;
  if (!Number.isFinite(windowStart.getTime()) || !Number.isFinite(windowEnd.getTime()) ||
      windowStart > windowEnd) throw new RangeError("Invalid faculty schedule date range");
  const assigned = await listFacultyCourseDeliveries(context);
  const sectionsList = [...new Map(assigned.map((course) => [
    course.sectionId,
    {
      sectionId: course.sectionId,
      sectionName: course.sectionName,
      sectionCode: course.sectionCode,
      academicPeriodName: course.academicPeriodName,
    },
  ])).values()];
  const coursesList = assigned.map((course) => ({
    deliveryId: course.deliveryId,
    sectionId: course.sectionId,
    courseId: course.courseId,
    courseName: course.courseName,
    courseCode: course.courseCode,
  }));

  if (assigned.length === 0) {
    return { sections: [], courses: [], events: [], upcomingEvents: [] };
  }

  const sectionIds = sectionsList.map((section) => section.sectionId);
  const deliveryIds = coursesList.map((course) => course.deliveryId);

  const events = await getDb()
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
      facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
      lectureHallId: sectionScheduleEvents.lectureHallId,
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
    .leftJoin(
      courseSectionDeliveries,
      eq(courseSectionDeliveries.id, sectionScheduleEventCourses.deliveryId),
    )
    .leftJoin(
      courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId),
    )
    .leftJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(
      collegeMemberships,
      eq(collegeMemberships.id, sectionScheduleEvents.facultyMembershipId),
    )
    .leftJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      lte(sectionScheduleEvents.startsAt, windowEnd),
      gte(sectionScheduleEvents.endsAt, windowStart),
      inArray(sectionScheduleEvents.sectionId, sectionIds),
      or(
        isNull(sectionScheduleEventCourses.deliveryId),
        and(
          inArray(sectionScheduleEventCourses.deliveryId, deliveryIds),
          // Fail closed if a malformed raw-SQL event/course link points at
          // a delivery in another Section, even one this Faculty also teaches.
          eq(courseSectionDeliveries.sectionId, sectionScheduleEvents.sectionId),
        ),
      ),
    ))
    .orderBy(asc(sectionScheduleEvents.startsAt));

  // An empty upcoming list is normal: it is not an authorization or 404 error.
  const upcomingCutoff = new Date(now.getTime() + 180 * 86400000);
  const upcomingEvents = events.filter(row =>
    row.endsAt >= now && row.startsAt <= upcomingCutoff);
  return { sections: sectionsList, courses: coursesList, events, upcomingEvents };
}
