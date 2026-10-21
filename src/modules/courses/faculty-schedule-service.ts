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
  options: { startAt?: Date; endAt?: Date; selectedDay?: Date; deliveryId?:string;sectionId?:string } = {},
) {
  // The old calendar queried only its visible range and independently showed
  // upcoming events for the next 180 days. Bound the indexed Section query
  // rather than scanning every historical scheduled event.
  const now = new Date();
  const windowStart = options.startAt ?? new Date(now.getTime() - 366 * 86400000);
  const minimumFuture = new Date(now.getTime() + 180 * 86400000);
  const windowEnd = options.endAt ?? minimumFuture;
  if (!Number.isFinite(windowStart.getTime()) || !Number.isFinite(windowEnd.getTime()) ||
      windowStart > windowEnd ||
      windowEnd.getTime()-windowStart.getTime()>548*86400000)
    throw new RangeError("Invalid faculty schedule date range");
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
    return { sections: [], courses: [], events: [], upcomingEvents: [],
      nextUpcoming:null,upcomingEmptyText:"No upcoming classes",
      selectedDayEvents:[],scheduledHours:0,teachingHours:0,
      hoursByDelivery:[],hoursBySection:[],truncated:false,range:{startAt:windowStart,endAt:windowEnd}};
  }
  if(options.deliveryId&&!coursesList.some(item=>item.deliveryId===options.deliveryId))
    throw new RangeError("Unknown faculty course delivery");
  if(options.sectionId&&!sectionsList.some(item=>item.sectionId===options.sectionId))
    throw new RangeError("Unknown faculty section");
  if(options.selectedDay&&!Number.isFinite(options.selectedDay.getTime()))
    throw new RangeError("Invalid selected date");

  const sectionIds = sectionsList.map((section) => section.sectionId);
  const deliveryIds = coursesList.map((course) => course.deliveryId);

  const events = await getDb()
    .select({
      id: sectionScheduleEvents.id,
      legacyScheduleId:sectionScheduleEvents.legacyScheduleId,
      sectionId: sectionScheduleEvents.sectionId,
      sectionName: sections.name,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      legacyRoomNumber:sectionScheduleEvents.legacyRoomNumber,
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
      inArray(sectionScheduleEvents.sectionId, options.sectionId?[options.sectionId]:sectionIds),
      or(
        isNull(sectionScheduleEventCourses.deliveryId),
        and(
          inArray(sectionScheduleEventCourses.deliveryId,options.deliveryId?[options.deliveryId]:deliveryIds),
          // Fail closed if a malformed raw-SQL event/course link points at
          // a delivery in another Section, even one this Faculty also teaches.
          eq(courseSectionDeliveries.sectionId, sectionScheduleEvents.sectionId),
        ),
      ),
    ))
    .orderBy(asc(sectionScheduleEvents.startsAt))
    .limit(5001);

  // An empty upcoming list is normal: it is not an authorization or 404 error.
  const truncated=events.length>5000;
  const visibleEvents=events.slice(0,5000);
  const upcomingCutoff = new Date(now.getTime() + 180 * 86400000);
  const upcomingEvents = visibleEvents.filter(row =>
    row.startsAt >= now && row.startsAt <= upcomingCutoff);
  const nextUpcoming=upcomingEvents[0]??null;
  const calendarDay=(value:Date)=>new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",day:"2-digit",month:"2-digit",year:"numeric",
  }).format(value);
  const selectedDayEvents=options.selectedDay?visibleEvents.filter(row=>
    calendarDay(row.startsAt)===calendarDay(options.selectedDay!)):[];
  // Course-linked rows can fan out one Section event. A single schedule ID
  // contributes duration once to total hours; per-delivery breakdown retains
  // that event only for its authorized linked delivery.
  const byEvent=new Map(visibleEvents.map(item=>[item.id,item] as const));
  const durationHours=(event:typeof visibleEvents[number])=>
    Math.max(0,(event.endsAt.getTime()-event.startsAt.getTime())/3600000);
  const scheduledHours=[...byEvent.values()].reduce((sum,item)=>sum+durationHours(item),0);
  const teachingHours=[...byEvent.values()].filter(item=>item.endsAt<=now)
    .reduce((sum,item)=>sum+durationHours(item),0);
  const hoursByDelivery=coursesList.map(course=>({
    deliveryId:course.deliveryId,courseName:course.courseName,sectionId:course.sectionId,
    hours:visibleEvents.filter(event=>event.deliveryId===course.deliveryId)
      .reduce((sum,event)=>sum+durationHours(event),0),
  }));
  const hoursBySection=sectionsList.map(section=>({
    sectionId:section.sectionId,sectionName:section.sectionName,
    hours:[...new Map(visibleEvents.filter(item=>item.sectionId===section.sectionId)
      .map(item=>[item.id,item] as const)).values()].reduce((sum,item)=>sum+durationHours(item),0),
  }));
  return { sections: sectionsList, courses: coursesList, events:visibleEvents,
    upcomingEvents,nextUpcoming,upcomingEmptyText:nextUpcoming?null:"No upcoming classes",
    selectedDayEvents,scheduledHours,teachingHours,hoursByDelivery,hoursBySection,
    truncated,range:{startAt:windowStart,endAt:windowEnd},
    hoursNote:"Past scheduled time is not independently confirmed attendance; cancelled sessions are excluded, and all numbers reflect only the selected authorized window." };
}
