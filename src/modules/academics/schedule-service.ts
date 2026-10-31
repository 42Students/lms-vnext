import {
  and,
  asc,
  count,
  eq,
  gte,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  academicPeriods,
  collegeMemberships,
  electiveOfferings,
  lmsGroupMembers,
  departments,
  courseOfferings,
  courseSectionDeliveries,
  courses,
  lectureHalls,
  sections,
  sectionScheduleEventCourses,
  sectionScheduleEvents,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { loadCourseSectionDeliveryScope } from "@/modules/courses/scope";
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
    `${period.startDate}T00:00:00+05:30`,
  ).getTime();
  const periodEndExclusive =
    new Date(
      `${period.endDate}T00:00:00+05:30`,
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

/**
 * Warning-only future half-open overlaps for enrolled elective learners.
 * Learner identities and group rosters never leave this server function.
 * The selected college scope protects both candidate and other offerings.
 */
export async function listFutureElectiveLearnerOverlaps(
  context: RequestContext, sectionId: string, from: Date, to: Date,
): Promise<Array<{ startsAt: Date; endsAt: Date }>> {
  const acting=await resolveActingCollege(context,"academics.manage");
  const section=z.string().uuid().parse(sectionId);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) ||
    from.getTime() >= to.getTime()) return [];
  const db=getDb();
  const candidateGroups=await db.select({groupId:electiveOfferings.groupId})
    .from(electiveOfferings)
    .innerJoin(courseSectionDeliveries,
      eq(courseSectionDeliveries.id,electiveOfferings.backedDeliveryId))
    .innerJoin(courses,eq(courses.id,electiveOfferings.courseId))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .where(and(eq(courseSectionDeliveries.sectionId,section),
      eq(departments.collegeId,acting.collegeId),
      eq(electiveOfferings.status,"ACTIVE"),
      isNull(electiveOfferings.deletedAt))).limit(200);
  const groupIds=[...new Set(candidateGroups.map(row=>row.groupId))];
  if (!groupIds.length) return [];
  const source=alias(lmsGroupMembers,"candidate_elective_members");
  const authorizedMembers=db.select({membershipId:source.membershipId})
    .from(source).where(and(inArray(source.groupId,groupIds),
      eq(source.state,"ACTIVE")));
  return db.selectDistinct({
    startsAt:sectionScheduleEvents.startsAt,
    endsAt:sectionScheduleEvents.endsAt,
  }).from(sectionScheduleEvents)
    .innerJoin(sectionScheduleEventCourses,
      eq(sectionScheduleEventCourses.scheduleEventId,sectionScheduleEvents.id))
    .innerJoin(electiveOfferings,
      eq(electiveOfferings.backedDeliveryId,sectionScheduleEventCourses.deliveryId))
    .innerJoin(lmsGroupMembers,and(
      eq(lmsGroupMembers.groupId,electiveOfferings.groupId),
      eq(lmsGroupMembers.state,"ACTIVE")))
    .innerJoin(courses,eq(courses.id,electiveOfferings.courseId))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .where(and(eq(departments.collegeId,acting.collegeId),
      eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt),
      eq(sectionScheduleEvents.status,"SCHEDULED"),
      ne(sectionScheduleEvents.sectionId,section),
      inArray(lmsGroupMembers.membershipId,authorizedMembers),
      lt(sectionScheduleEvents.startsAt,to),
      gt(sectionScheduleEvents.endsAt,from),
      gt(sectionScheduleEvents.endsAt,new Date()),
    ))
    .orderBy(asc(sectionScheduleEvents.startsAt)).limit(200);
}

type ScheduleTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** P5-R11: period closure takes FOR UPDATE on this parent row. Every schedule
 * writer must take a compatible parent lock inside its own write transaction
 * and re-read the committed status/dates, never trust a preflight snapshot. */
async function lockMutableSchedulePeriod(tx: ScheduleTx, periodId: string, collegeId: string) {
  const [period] = await tx.select({
    startDate: academicPeriods.startDate,
    endDate: academicPeriods.endDate,
    status: academicPeriods.status,
  }).from(academicPeriods)
    .where(and(eq(academicPeriods.id, periodId),
      eq(academicPeriods.collegeId, collegeId)))
    .for("share").limit(1);
  if (!period || period.status === "CLOSED") {
    throw new AcademicsServiceError("ACADEMIC_PERIOD_CLOSED");
  }
  return period;
}

/** Preflight checks alone can race a course offering closure. Hold SHARE locks
 * on both the delivery and offering until the schedule link commits. This
 * covers creates, course edits and cross-section moves alike. */
async function assertScheduleDeliveryInsideTransaction(
  tx: ScheduleTx, deliveryId: string, sectionId: string,
) {
  const [active] = await tx.select({id: courseSectionDeliveries.id})
    .from(courseSectionDeliveries)
    .innerJoin(courseOfferings,
      eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .where(and(
      eq(courseSectionDeliveries.id, deliveryId),
      eq(courseSectionDeliveries.sectionId, sectionId),
      isNull(courseSectionDeliveries.endedAt),
      eq(courseOfferings.status, "ACTIVE"),
    ))
    .for("share")
    .limit(1);
  if (!active)
    throw new AcademicsServiceError("SCHEDULE_COURSE_DELIVERY_MISMATCH");
}

async function assertScheduleResources(tx: ScheduleTx, input: {
  collegeId: string;
  sectionId: string;
  facultyMembershipId: string | null;
  lectureHallId: string | null;
  startsAt: Date;
  endsAt: Date;
  exceptEventId?: string;
}) {
  // Transaction-scoped college lock serializes schedule edits across sections
  // and faculty. A hash collision may add waiting, never grant data access.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.collegeId}))`);

  if (input.lectureHallId) {
    // Parent lock prevents a concurrent archive from racing this booking.
    const [hall] = await tx.select({ capacity: lectureHalls.capacity })
      .from(lectureHalls)
      .where(and(eq(lectureHalls.id, input.lectureHallId),
        eq(lectureHalls.collegeId, input.collegeId),
        eq(lectureHalls.status, "ACTIVE")))
      .for("update").limit(1);
    if (!hall) throw new AcademicsServiceError("SCHEDULE_HALL_NOT_FOUND");
    const [section] = await tx.select({ capacity: sections.capacity })
      .from(sections).where(eq(sections.id, input.sectionId)).limit(1);
    if (section?.capacity !== null && section?.capacity !== undefined &&
        section.capacity > hall.capacity) {
      throw new AcademicsServiceError("SCHEDULE_HALL_CAPACITY_CONFLICT");
    }
  }

  const resources = [eq(sectionScheduleEvents.sectionId, input.sectionId)];
  if (input.facultyMembershipId) {
    resources.push(eq(sectionScheduleEvents.facultyMembershipId, input.facultyMembershipId));
  }
  if (input.lectureHallId) {
    resources.push(eq(sectionScheduleEvents.lectureHallId, input.lectureHallId));
  }
  const [overlap] = await tx.select({
    sectionId: sectionScheduleEvents.sectionId,
    facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
    lectureHallId: sectionScheduleEvents.lectureHallId,
  }).from(sectionScheduleEvents)
    .where(and(
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      lt(sectionScheduleEvents.startsAt, input.endsAt),
      gt(sectionScheduleEvents.endsAt, input.startsAt),
      or(...resources),
      ...(input.exceptEventId
        ? [ne(sectionScheduleEvents.id, input.exceptEventId)] : []),
    )).limit(1);
  if (!overlap) return;
  if (overlap.sectionId === input.sectionId) {
    throw new AcademicsServiceError("SCHEDULE_SECTION_CONFLICT");
  }
  if (input.facultyMembershipId && overlap.facultyMembershipId === input.facultyMembershipId) {
    throw new AcademicsServiceError("SCHEDULE_FACULTY_CONFLICT");
  }
  throw new AcademicsServiceError("SCHEDULE_HALL_CONFLICT");
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

async function validateDeliveryForSection(
  deliveryId: string | null | undefined,
  sectionId: string,
) {
  if (!deliveryId) {
    return;
  }

  const delivery =
    await loadCourseSectionDeliveryScope(deliveryId);

  // The scheduling picker exposes only active deliveries. Refuse a stale
  // course choice on submit rather than creating an event linked to a closed
  // or draft offering that the current class no longer teaches.
  if (delivery.sectionId !== sectionId || delivery.offeringStatus !== "ACTIVE") {
    throw new AcademicsServiceError(
      "SCHEDULE_COURSE_DELIVERY_MISMATCH",
    );
  }
}

export async function listSectionScheduleCourseChoices(
  context: RequestContext,
  sectionIdInput: string,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "courses.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  return getDb()
    .select({
      deliveryId: courseSectionDeliveries.id,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(courseSectionDeliveries)
    .innerJoin(
      courseOfferings,
      and(
        eq(
          courseOfferings.id,
          courseSectionDeliveries.offeringId,
        ),
        eq(courseOfferings.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      courses,
      and(
        eq(courses.id, courseOfferings.courseId),
        eq(courses.status, "ACTIVE"),
      ),
    )
    .where(
      and(
        eq(
          courseSectionDeliveries.sectionId,
          sectionId,
        ),
        isNull(courseSectionDeliveries.endedAt),
      ),
    )
    .orderBy(asc(courses.name));
}


const scheduleRangeSchema=z.strictObject({
  fromDate:z.iso.date().optional(),
  toDate:z.iso.date().optional(),
  courseSlug:z.string().trim().max(160).optional(),
  courseId:z.string().trim().max(160).optional(),
  // Omitted means the admin's any-faculty view; the supplied UUID scopes
  // faculty-specific timetable reads without promoting section access.
  facultyMembershipId:z.uuid().optional(),
  status:z.enum(["SCHEDULED","CANCELLED","ALL"]).default("ALL"),
}).refine(value=>!value.fromDate||!value.toDate||value.fromDate<=value.toDate,
  {path:["toDate"],message:"startDate must be before or equal to endDate"});

/** Interpret the legacy date range in the LMS's authoritative IST zone.
 * End-date is inclusive by using midnight of the NEXT calendar day as an
 * exclusive bound, preserving fractional-second records through 23:59:59.
 */
function scheduleFilters(raw:unknown){
  const input=scheduleRangeSchema.parse(raw??{});
  const start=input.fromDate?new Date(`${input.fromDate}T00:00:00+05:30`):null;
  const end=input.toDate?new Date(
    new Date(`${input.toDate}T00:00:00+05:30`).getTime()+86400000):null;
  const courseSlug=input.courseSlug?.trim()||
    (input.courseId?.startsWith("crs-")?input.courseId.slice(4):undefined);
  const courseId=courseSlug?undefined:input.courseId;
  if(courseId&&!z.uuid().safeParse(courseId).success)
    throw new AcademicsServiceError("SCHEDULE_COURSE_NOT_FOUND");
  return {start,end,courseSlug,courseId,
    facultyMembershipId:input.facultyMembershipId,status:input.status};
}

function eventConditions(
  sectionId:string,
  filter:ReturnType<typeof scheduleFilters>,
){
  return and(
    eq(sectionScheduleEvents.sectionId,sectionId),
    filter.facultyMembershipId
      ?eq(sectionScheduleEvents.facultyMembershipId,filter.facultyMembershipId):undefined,
    filter.start?gte(sectionScheduleEvents.startsAt,filter.start):undefined,
    filter.end?lt(sectionScheduleEvents.startsAt,filter.end):undefined,
    filter.courseSlug?eq(courses.slug,filter.courseSlug):undefined,
    filter.courseId?eq(courses.id,filter.courseId):undefined,
    filter.status!=="ALL"?eq(sectionScheduleEvents.status,filter.status):undefined,
  );
}

export async function listSectionScheduleEvents(
  context: RequestContext,
  sectionIdInput: string,
  rawFilters: unknown = {},
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "academics.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  const db = getDb();
  const filters=scheduleFilters(rawFilters);

  return db
    .select({
      id: sectionScheduleEvents.id,
      sectionId: sectionScheduleEvents.sectionId,
      facultyMembershipId:
        sectionScheduleEvents.facultyMembershipId,
      facultyName: users.displayName,
      deliveryId:
        sectionScheduleEventCourses.deliveryId,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      courseSlug: courses.slug,
      title: sectionScheduleEvents.title,
      description: sectionScheduleEvents.description,
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      location: sectionScheduleEvents.location,
      lectureHallId: sectionScheduleEvents.lectureHallId,
      status: sectionScheduleEvents.status,
      createdAt: sectionScheduleEvents.createdAt,
      updatedAt: sectionScheduleEvents.updatedAt,
    })
    .from(sectionScheduleEvents)
    .leftJoin(
      sectionScheduleEventCourses,
      eq(
        sectionScheduleEventCourses.scheduleEventId,
        sectionScheduleEvents.id,
      ),
    )
    .leftJoin(
      courseSectionDeliveries,
      eq(
        courseSectionDeliveries.id,
        sectionScheduleEventCourses.deliveryId,
      ),
    )
    .leftJoin(
      courseOfferings,
      eq(
        courseOfferings.id,
        courseSectionDeliveries.offeringId,
      ),
    )
    .leftJoin(
      courses,
      eq(courses.id, courseOfferings.courseId),
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
      eq(users.id, collegeMemberships.userId),
    )
    .where(eventConditions(sectionId,filters))
    .orderBy(
      asc(sectionScheduleEvents.startsAt),
      asc(sectionScheduleEvents.id),
    );
}


/** Count the same scoped date/course/status set without fetching event rows. */
export async function countSectionScheduleEvents(
  context:RequestContext,sectionIdInput:string,rawFilters:unknown={},
){
  const sectionId=sectionIdSchema.parse(sectionIdInput);
  const section=await loadSectionScope(sectionId);
  requirePermission(context,"academics.read",{
    organizationId:section.organizationId,collegeId:section.collegeId,
  });
  const filters=scheduleFilters(rawFilters);
  const [row]=await getDb().select({total:count()})
    .from(sectionScheduleEvents)
    .leftJoin(sectionScheduleEventCourses,eq(sectionScheduleEventCourses.scheduleEventId,
      sectionScheduleEvents.id))
    .leftJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,
      sectionScheduleEventCourses.deliveryId))
    .leftJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .leftJoin(courses,eq(courses.id,courseOfferings.courseId))
    .where(eventConditions(sectionId,filters));
  return {count:row?.total??0};
}

/** Explicit cross-section move, separate from the default edit boundary.
 * Both sections must belong to the SAME acting college, and course delivery
 * mappings are never carried across sections implicitly.
 */
export async function moveSectionScheduleEvent(
  context:RequestContext,raw:unknown,
){
  const input=z.strictObject({
    eventId:z.uuid(),targetSectionId:z.uuid(),
    targetDeliveryId:z.uuid().nullable().optional(),
  }).parse(raw);
  const [scope,target]=await Promise.all([
    loadScheduleEventScope(input.eventId),loadSectionScope(input.targetSectionId),
  ]);
  requirePermission(context,"academics.manage",{
    organizationId:scope.organizationId,collegeId:scope.collegeId,
  });
  requirePermission(context,"academics.manage",{
    organizationId:target.organizationId,collegeId:target.collegeId,
  });
  if(scope.collegeId!==target.collegeId)
    throw new AcademicsServiceError("ACADEMIC_PERIOD_COLLEGE_MISMATCH");
  if(scope.status!=="SCHEDULED"||target.status!=="ACTIVE")
    throw new AcademicsServiceError("SCHEDULE_EVENT_NOT_FOUND");
  const period=await loadAcademicPeriodScope(target.academicPeriodId);
  if(period.status==="CLOSED")
    throw new AcademicsServiceError("ACADEMIC_PERIOD_CLOSED");
  if(input.targetDeliveryId)
    await validateDeliveryForSection(input.targetDeliveryId,target.id);
  return getDb().transaction(async tx=>{
    const [current]=await tx.select({
      id:sectionScheduleEvents.id,
      startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt,
      facultyMembershipId:sectionScheduleEvents.facultyMembershipId,
      lectureHallId:sectionScheduleEvents.lectureHallId,
      status:sectionScheduleEvents.status,
    }).from(sectionScheduleEvents)
      .where(and(eq(sectionScheduleEvents.id,input.eventId),
        eq(sectionScheduleEvents.sectionId,scope.sectionId)))
      .for("update").limit(1);
    if(!current||current.status!=="SCHEDULED")
      throw new AcademicsServiceError("SCHEDULE_EVENT_NOT_FOUND");
    eventWindowInsidePeriod(current.startsAt,current.endsAt,period);
    if (input.targetDeliveryId)
      await assertScheduleDeliveryInsideTransaction(tx,input.targetDeliveryId,target.id);
    await assertScheduleResources(tx,{
      collegeId:target.collegeId,sectionId:target.id,
      facultyMembershipId:current.facultyMembershipId,
      lectureHallId:current.lectureHallId,
      startsAt:current.startsAt,endsAt:current.endsAt,
      exceptEventId:current.id,
    });
    const [updated]=await tx.update(sectionScheduleEvents)
      .set({sectionId:target.id,updatedAt:new Date()})
      .where(and(eq(sectionScheduleEvents.id,input.eventId),
        eq(sectionScheduleEvents.sectionId,scope.sectionId),
        eq(sectionScheduleEvents.status,"SCHEDULED"))).returning();
    if(!updated)throw new AcademicsServiceError("SCHEDULE_EVENT_NOT_FOUND");
    await tx.delete(sectionScheduleEventCourses)
      .where(eq(sectionScheduleEventCourses.scheduleEventId,input.eventId));
    if(input.targetDeliveryId){
      await tx.insert(sectionScheduleEventCourses).values({
        scheduleEventId:input.eventId,deliveryId:input.targetDeliveryId,
      });
    }
    return updated;
  });
}

export async function createSectionScheduleEvent(
  context: RequestContext,
  rawInput: CreateSectionScheduleEventInput,
) {
  const input =
    createSectionScheduleEventInputSchema.parse(
      rawInput,
    );
  const lectureHallId = input.lectureHallId;
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

  await Promise.all([
    validateFacultyForSection(
      input.facultyMembershipId,
      section.collegeId,
    ),
    validateDeliveryForSection(
      input.deliveryId,
      input.sectionId,
    ),
  ]);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  eventWindowInsidePeriod(
    startsAt,
    endsAt,
    period,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const lockedPeriod = await lockMutableSchedulePeriod(
      tx, section.academicPeriodId, section.collegeId,
    );
    eventWindowInsidePeriod(startsAt, endsAt, lockedPeriod);
    if (input.deliveryId)
      await assertScheduleDeliveryInsideTransaction(tx,input.deliveryId,input.sectionId);
    await assertScheduleResources(tx, {
      collegeId: section.collegeId,
      sectionId: input.sectionId,
      facultyMembershipId: input.facultyMembershipId ?? null,
      lectureHallId: lectureHallId ?? null,
      startsAt, endsAt,
    });
    const [created] = await tx
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
        lectureHallId: lectureHallId ?? null,
      })
      .returning();

    if (input.deliveryId) {
      await tx
        .insert(sectionScheduleEventCourses)
        .values({
          scheduleEventId: created!.id,
          deliveryId: input.deliveryId,
        });
    }

    return created!;
  });
}

/** Legacy recurring schedule creation commits each date independently:
 * a room/time collision cannot roll back another date's successful class.
 * Keep the original per-date permission and resource validation. */
export async function createSectionScheduleEventsIndependently(
 context:RequestContext,raw:unknown,
) {
 const events=z.array(createSectionScheduleEventInputSchema).min(1).max(60).parse(raw);
 const results:Array<{index:number;id:string|null;errorCode:string|null}>=[];
 for(const [index,input] of events.entries()){
  try{
   const event=await createSectionScheduleEvent(context,input);
   results.push({index,id:event.id,errorCode:null});
  }catch(error){
   // Authorization is never converted to a partial-success item.
   if(error instanceof AuthorizationError)throw error;
   results.push({index,id:null,errorCode:error instanceof AcademicsServiceError
     ?error.code:"SCHEDULE_EVENT_CONFLICT"});
  }
 }
 return {results,createdCount:results.filter(item=>item.id!==null).length,
  failedCount:results.filter(item=>item.errorCode!==null).length};
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
  const requestedRoom = input.lectureHallId;
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

  await Promise.all([
    input.facultyMembershipId !== undefined
      ? validateFacultyForSection(
          input.facultyMembershipId,
          scope.collegeId,
        )
      : Promise.resolve(),
    input.deliveryId !== undefined
      ? validateDeliveryForSection(
          input.deliveryId,
          scope.sectionId,
        )
      : Promise.resolve(),
  ]);

  const db = getDb();

  return db.transaction(async (tx) => {
    const lockedPeriod = await lockMutableSchedulePeriod(
      tx, scope.academicPeriodId, scope.collegeId,
    );
    // Lock the event before deriving unchanged resource fields, preventing a
    // concurrent edit from silently reverting faculty/time/room changes.
    const [current] = await tx.select({
      startsAt: sectionScheduleEvents.startsAt,
      endsAt: sectionScheduleEvents.endsAt,
      facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
      lectureHallId: sectionScheduleEvents.lectureHallId,
      status: sectionScheduleEvents.status,
    }).from(sectionScheduleEvents)
      .where(eq(sectionScheduleEvents.id, eventId))
      .for("update").limit(1);
    if (!current || current.status !== "SCHEDULED") {
      throw new AcademicsServiceError("SCHEDULE_EVENT_NOT_FOUND");
    }
    const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : current.endsAt;
    eventWindowInsidePeriod(startsAt, endsAt, lockedPeriod);
    if (input.deliveryId)
      await assertScheduleDeliveryInsideTransaction(tx,input.deliveryId,scope.sectionId);
    await assertScheduleResources(tx, {
      collegeId: scope.collegeId,
      sectionId: scope.sectionId,
      facultyMembershipId: input.facultyMembershipId === undefined
        ? current.facultyMembershipId : input.facultyMembershipId,
      lectureHallId: requestedRoom === undefined
        ? current.lectureHallId : requestedRoom,
      startsAt, endsAt, exceptEventId: eventId,
    });
    const [updated] = await tx
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
        ...(requestedRoom !== undefined
          ? { lectureHallId: requestedRoom }
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

    if (input.deliveryId !== undefined) {
      await tx
        .delete(sectionScheduleEventCourses)
        .where(
          eq(
            sectionScheduleEventCourses.scheduleEventId,
            eventId,
          ),
        );

      if (input.deliveryId) {
        await tx
          .insert(sectionScheduleEventCourses)
          .values({
            scheduleEventId: eventId,
            deliveryId: input.deliveryId,
          });
      }
    }

    return updated;
  });
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
