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
import { CoursesServiceError } from "@/modules/courses/errors";

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
      legacyClassId: sections.legacyClassId,
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
        // Current sections plus previously attended, ended sections when
        // reading an explicit historical date window. A learner may see their
        // own past term after graduation, but never another learner's roster.
        or(
          and(
            eq(learnerProgramEnrollments.status, "ACTIVE"),
            eq(sectionEnrollments.status, "ACTIVE"),
            eq(sections.status, "ACTIVE"),
            inArray(academicPeriods.status, ["PLANNED", "ACTIVE"]),
          ),
          ...(visibleWindow ? [and(
            inArray(sectionEnrollments.status, ["COMPLETED", "WITHDRAWN"]),
            inArray(academicPeriods.status, ["ACTIVE", "CLOSED"]),
            sql`${academicPeriods.endDate} >= ${visibleWindow.from.toISOString().slice(0,10)}::date`,
            sql`${academicPeriods.startDate} <= ${visibleWindow.to.toISOString().slice(0,10)}::date`,
          )] : []),
        ),
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(sections.name),
    );

  // The course roster is the canonical union of primary-section learners and
  // ACTIVE group-backed elective memberships. Never infer elective access from
  // the host section alone.
  // Delivery-scoped course options are intentionally narrower than the
  // full program catalog: primary classes and elective group rosters confer
  // access, but mere curriculum membership never exposes other classes.
  let accessible: Awaited<ReturnType<typeof listLearnerCourseDeliveries>> = [];
  let courseLookupWarning: string | null = null;
  try {
    accessible = await listLearnerCourseDeliveries(context, {
      includeHistorical: Boolean(visibleWindow),
    });
  } catch (error) {
    // A course roster outage is not a reason to hide already-authorized,
    // delivery-free section events. Never downgrade any access denial.
    if (error instanceof AuthorizationError ||
        error instanceof CoursesServiceError ||
        error instanceof AcademicsServiceError) throw error;
    courseLookupWarning =
      "Failed to load course data. Calendar events may be incomplete. Please try refreshing the page.";
  }
  const deliveryIds = [...new Set(accessible.map(course => course.deliveryId))];
  // Only resolve slug metadata for course UUIDs returned by the validated
  // learner-delivery service. A raw URL courseId is never a grant.
  const courseIds=[...new Set(accessible.map(course=>course.courseId))];
  const courseSlugRows=courseIds.length?await db.select({
    id:courses.id,slug:courses.slug,legacyCourseId:courses.legacyCourseId,
  }).from(courses).where(inArray(courses.id,courseIds)):[];
  const slugsById=new Map(courseSlugRows.map(item=>[item.id,item]));
  const coursesList = [...new Map(accessible.map(course => [
    course.deliveryId,
    { deliveryId: course.deliveryId, sectionId: course.sectionId,
      courseId: course.courseId, courseName: course.courseName,
      courseCode: course.courseCode,
      courseSlug:slugsById.get(course.courseId)?.slug??null,
      legacyCourseId:slugsById.get(course.courseId)?.legacyCourseId??null },
  ])).values()].sort((a, b) => a.courseName.localeCompare(b.courseName));
  if (placements.length === 0 && deliveryIds.length === 0)
    return { sections: [], courses: [], events: [], courseLookupWarning,
      lookupStatus:courseLookupWarning?"LOOKUP_FAILED" as const:"UNASSIGNED" as const };

  const primarySectionIds = [...new Set(placements.map(row => row.sectionId))];
  const authorizedLink = deliveryIds.length
    ? inArray(sectionScheduleEventCourses.deliveryId, deliveryIds)
    : sql<boolean>`false`;

  // Window end is exclusive UTC (next-day midnight for inclusive date
  // filters); >= start includes an event ending exactly at the requested
  // lower boundary. Legacy local date strings must be migrated to IST first.
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
      courseSlug: courses.slug,
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
    .orderBy(asc(sectionScheduleEvents.startsAt),asc(sectionScheduleEvents.id));

  return { sections: placements, courses: coursesList, events, courseLookupWarning,
    lookupStatus:courseLookupWarning?"PARTIAL" as const:"READY" as const };
}

/** /learn/calendar is the destination for legacy student class/schedule URLs.
 * Boundaries are inclusive IST calendar days, with an exclusive next-day end
 * so events at 23:59:59.999 aren't lost to second precision truncation.
 */
const learnerCalendarRangeSchema=z.strictObject({
  from:z.iso.date(),to:z.iso.date(),
}).refine(value=>value.from<=value.to,{
  path:["to"],message:"startDate must be before or equal to endDate",
});

function startOfLearnerIstDay(day:string){
  return new Date(`${day}T00:00:00+05:30`);
}

export async function getLearnerScheduleForRange(
  context:RequestContext,raw:unknown,
){
  const dates=learnerCalendarRangeSchema.parse(raw);
  const from=startOfLearnerIstDay(dates.from);
  const to=new Date(startOfLearnerIstDay(dates.to).getTime()+86_400_000);
  return getLearnerClassSchedule(context,{from,to});
}

export async function getLearnerScheduleForDay(
  context:RequestContext,rawDay:unknown,
){
  const day=z.iso.date().parse(rawDay);
  return getLearnerScheduleForRange(context,{from:day,to:day});
}

export async function getLearnerScheduleForWeek(
  context:RequestContext,rawDay:unknown,
){
  const day=z.iso.date().parse(rawDay);
  const date=new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
  const from=date.toISOString().slice(0,10);
  date.setUTCDate(date.getUTCDate()+6);
  return getLearnerScheduleForRange(context,{
    from,to:date.toISOString().slice(0,10),
  });
}

/** Only map old bookmarks to CURRENT ACTOR-authorized section/course rows.
 * An unresolved, duplicate or foreign legacy numeric ID returns null; it
 * never turns into an unscoped administrative schedule lookup.
 */
export async function resolveLearnerCalendarBookmark(
  context:RequestContext,raw:unknown,
):Promise<string|null>{
  const input=z.strictObject({
    classId:z.string().trim().min(1).max(80).optional(),
    courseId:z.string().trim().min(1).max(160).optional(),
    courseSlug:z.string().trim().min(1).max(160).optional(),
    day:z.iso.date().optional(),
  }).parse(raw);
  const data=await getLearnerClassSchedule(context);
  const classes=input.classId?data.sections.filter(row=>
    row.sectionId===input.classId||String(row.legacyClassId??"")===input.classId):[];
  if(input.classId&&classes.length!==1)return null;
  const source=input.courseSlug||input.courseId?.replace(/^crs-/,"");
  const courseRows=source?data.courses.filter(row=>
    row.courseSlug===source||row.courseId===source||
    String(row.legacyCourseId??"")===source):[];
  if(source&&courseRows.length!==1)return null;
  const params=new URLSearchParams();
  if(classes.length)params.set("sectionId",classes[0]!.sectionId);
  if(courseRows.length)params.set("courseId",courseRows[0]!.courseId);
  if(input.day)params.set("date",input.day);
  return "/learn/calendar"+(params.size?"?"+params.toString():"");
}
