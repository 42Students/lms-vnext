import "server-only";

import { and, asc, count, countDistinct, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { exists } from "drizzle-orm";
import { ne, not } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  courses,
  departments,
  electiveOfferings,
  electiveSlots,
  learnerProgramEnrollments,
  lmsGroupMembers,
  membershipRoles,
  programs,
  sectionEnrollments,
  courseSectionDeliveries,
  sectionFacultyAssignments,
  sectionScheduleEvents,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  COLLEGE_STRUCTURE_PAGE_SIZE,
  collegeStructureQuerySchema,
  collegeClassQuerySchema,
  collegeElectiveQuerySchema,
  collegeStructureTotalPages,
} from "./college-structure-directory-model";

async function ownCollege(context: RequestContext) {
  const scope = await resolveActingCollege(context, "academics.read");
  return scope.collegeId;
}

function searchPattern(search: string) {
  return "%" + search.replace(/[\\%_]/g, "\\$&") + "%";
}

function scopedPrograms(collegeId: string) {
  return getDb().select({
    id: programs.id,
    name: programs.name,
    code: programs.code,
  }).from(programs)
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .orderBy(asc(programs.name), asc(programs.id));
}

/** Registered section/learner-enrollment tables only; never infers scheduled attendance. */
export async function listCollegeClasses(context: RequestContext, raw: unknown) {
  const query = collegeClassQuerySchema.parse(raw);
  const collegeId = await ownCollege(context);
  const db = getDb();
  const scoped = db.select({
    id: sections.id,
    cohortId: sections.cohortId,
    academicPeriodId: sections.academicPeriodId,
    name: sections.name,
    code: sections.code,
    status: sections.status,
    updatedAt: sql<Date>`${sections.updatedAt}`.mapWith(sections.updatedAt).as("section_updated_at"),
    capacity: sections.capacity,
    minSize: sections.minSize,
    description: sections.description,
    canDelete: sql<boolean>`NOT EXISTS (
      SELECT 1 FROM ${sectionEnrollments} WHERE ${sectionEnrollments.sectionId} = ${sections.id}
    ) AND NOT EXISTS (
      SELECT 1 FROM ${sectionFacultyAssignments} WHERE ${sectionFacultyAssignments.sectionId} = ${sections.id}
    ) AND NOT EXISTS (
      SELECT 1 FROM ${sectionScheduleEvents} WHERE ${sectionScheduleEvents.sectionId} = ${sections.id}
    ) AND NOT EXISTS (
      SELECT 1 FROM ${courseSectionDeliveries} WHERE ${courseSectionDeliveries.sectionId} = ${sections.id}
    )`.as("class_can_delete"),
    programId: sql<string | null>`${programs.id}`.as("class_program_id"),
    linkedProgramId: sql<string | null>`${cohorts.programId}`.as("linked_class_program_id"),
    programName: sql<string | null>`${programs.name}`.as("class_program_name"),
    cohortName: sql<string | null>`${cohorts.name}`.as("class_cohort_name"),
    periodName: sql<string>`${academicPeriods.name}`.as("class_period_name"),
  }).from(sections)
    // The college-owned academic period anchors damaged imported class links;
    // a broken cohort/program can still be shown, never a foreign college's class.
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, sections.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .leftJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .leftJoin(programs, eq(programs.id, cohorts.programId))
    .leftJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      or(eq(departments.collegeId, collegeId), isNull(departments.id)),
      query.programId ? eq(programs.id, query.programId) : undefined,
      query.departmentCode ? eq(departments.name, query.departmentCode) : undefined,
      query.periodEndsOnOrBefore ? lte(academicPeriods.endDate, query.periodEndsOnOrBefore) : undefined,
      query.periodStartsOnOrAfter ? gte(academicPeriods.startDate, query.periodStartsOnOrAfter) : undefined,
      query.deliveryPresence === "HAS_DELIVERIES" ? exists(db.select({id:courseSectionDeliveries.id}).from(courseSectionDeliveries).where(eq(courseSectionDeliveries.sectionId,sections.id))) : query.deliveryPresence === "NO_DELIVERIES" ? not(exists(db.select({id:courseSectionDeliveries.id}).from(courseSectionDeliveries).where(eq(courseSectionDeliveries.sectionId,sections.id)))) : undefined,
      query.facultyCoverage === "HAS_FACULTY" ? exists(db.select({id:sectionFacultyAssignments.id}).from(sectionFacultyAssignments).where(and(eq(sectionFacultyAssignments.sectionId,sections.id),isNull(sectionFacultyAssignments.endedAt)))) : query.facultyCoverage === "NO_FACULTY" ? not(exists(db.select({id:sectionFacultyAssignments.id}).from(sectionFacultyAssignments).where(and(eq(sectionFacultyAssignments.sectionId,sections.id),isNull(sectionFacultyAssignments.endedAt))))) : undefined,
      query.schedulePresence === "HAS_EVENTS" ? exists(db.select({id:sectionScheduleEvents.id}).from(sectionScheduleEvents).where(eq(sectionScheduleEvents.sectionId,sections.id))) : query.schedulePresence === "NO_EVENTS" ? not(exists(db.select({id:sectionScheduleEvents.id}).from(sectionScheduleEvents).where(eq(sectionScheduleEvents.sectionId,sections.id)))) : undefined,
      query.cohortName ? eq(cohorts.name,query.cohortName) : undefined,
      query.className ? eq(sections.name,query.className) : undefined,
      query.programCode ? eq(programs.code,query.programCode) : undefined,
      query.periodLifecycle !== "ALL" ? eq(academicPeriods.status,query.periodLifecycle) : undefined,
      query.cohortCode ? eq(cohorts.code, query.cohortCode) : undefined,
      query.classCode ? eq(sections.code,query.classCode) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.capacityState === "CONFIGURED" ? isNotNull(sections.capacity) :
        query.capacityState === "UNSET" ? isNull(sections.capacity) : undefined,
      query.minimumCapacity !== undefined ? gte(sections.capacity, query.minimumCapacity) : undefined,
      query.maximumCapacity !== undefined ? lte(sections.capacity, query.maximumCapacity) : undefined,
      query.status === "ALL" ? undefined : eq(sections.status, query.status),
      query.cohortStatus && query.cohortStatus !== "ALL" ? eq(cohorts.status,query.cohortStatus) : undefined,
      query.programStatus && query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.q ? or(
        ilike(sections.name, searchPattern(query.q)),
        ilike(sections.code, searchPattern(query.q)),
        ilike(cohorts.name, searchPattern(query.q)),
        ilike(programs.name, searchPattern(query.q)),
        sql<boolean>`${sections.capacity}::text ILIKE ${searchPattern(query.q)}`,
        ilike(sections.description, searchPattern(query.q)),
      ) : undefined,
    )).as("college_structure_classes");

  const [totals, baseRows, programChoices] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.programName), asc(scoped.cohortName), asc(scoped.name), asc(scoped.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    scopedPrograms(collegeId),
  ]);
  const ids = baseRows.map(row => row.id);
  // A failed dependency count is unknown, not zero. Keep the directory usable.
  let enrollmentCountsAvailable = true;
  const counts = ids.length ? await db.select({
    sectionId: sectionEnrollments.sectionId,
    enrolled: count(),
  }).from(sectionEnrollments)
    .innerJoin(sections, and(
      eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
    ))
    .innerJoin(learnerProgramEnrollments, and(
      eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId),
      eq(learnerProgramEnrollments.cohortId, sections.cohortId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ))
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      inArray(sectionEnrollments.sectionId, ids),
      eq(sectionEnrollments.status, "ACTIVE"),
    ))
    .groupBy(sectionEnrollments.sectionId).catch(() => {
      enrollmentCountsAvailable = false;
      return [] as { sectionId: string; enrolled: number }[];
    }) : [];
  const countById = new Map(counts.map(item => [item.sectionId, item.enrolled]));
  const items = baseRows.map(item => ({
    ...item,
    activeLearners: enrollmentCountsAvailable ? countById.get(item.id) ?? 0 : null,
  }));
  const total = totals[0]?.total ?? 0;
  return {
    kind: "CLASSES" as const,
    query, items, total, programs: programChoices,
    totalPages: collegeStructureTotalPages(total, query.pageSize),
  };
}

/** Registered elective slot directory. Not a learner-selection or feature-enablement claim. */
export async function listCollegeElectives(context: RequestContext, raw: unknown) {
  const query = collegeElectiveQuerySchema.parse(raw);
  const collegeId = await ownCollege(context);
  const db = getDb();
  const scoped = db.select({
    id: electiveSlots.id,
    name: electiveSlots.name,
    semesterNumber: electiveSlots.semesterNumber,
    academicYear: electiveSlots.academicYear,
    academicPeriodId: electiveSlots.academicPeriodId,
    hasEnrollmentHistory: sql<boolean>`exists (
      select 1 from elective_offerings eo where eo.slot_id = ${electiveSlots.id}
      and (exists (select 1 from lms_group_members gm where gm.group_id=eo.group_id)
        or exists (select 1 from lms_group_member_events ev where ev.group_id=eo.group_id))
    )`.as("elective_has_enrollment_history"),
    credits: electiveSlots.credits,
    description: electiveSlots.description,
    version: electiveSlots.version,
    minPick: electiveSlots.minPick,
    maxPick: electiveSlots.maxPick,
    status: electiveSlots.status,
    programId: sql<string>`${programs.id}`.as("elective_program_id"),
    programName: sql<string>`${programs.name}`.as("elective_program_name"),
    periodName: sql<string | null>`${academicPeriods.name}`.as("elective_period_name"),
  }).from(electiveSlots)
    .innerJoin(programs, eq(programs.id, electiveSlots.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .leftJoin(academicPeriods, and(
      eq(academicPeriods.id, electiveSlots.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      eq(electiveSlots.collegeId, collegeId),
      isNull(electiveSlots.deletedAt),
      or(isNull(electiveSlots.academicPeriodId), sql`${academicPeriods.id} is not null`),
      query.programId ? eq(programs.id, query.programId) : undefined,
      query.periodEndsOnOrBefore ? lte(academicPeriods.endDate,query.periodEndsOnOrBefore) : undefined,
      query.periodStartsOnOrAfter ? gte(academicPeriods.startDate,query.periodStartsOnOrAfter) : undefined,
      query.descriptionPresence === "RECORDED" ? isNotNull(electiveSlots.description) : query.descriptionPresence === "MISSING" ? isNull(electiveSlots.description) : undefined,
      query.periodLifecycle !== "ALL" ? eq(academicPeriods.status,query.periodLifecycle) : undefined,
      query.semesterThrough !== undefined ? lte(electiveSlots.semesterNumber,query.semesterThrough) : undefined,
      query.semesterFrom !== undefined ? gte(electiveSlots.semesterNumber,query.semesterFrom) : undefined,
      query.maximumAllowedPicks !== undefined ? lte(electiveSlots.maxPick,query.maximumAllowedPicks) : undefined,
      query.minimumRequiredPicks !== undefined ? gte(electiveSlots.minPick,query.minimumRequiredPicks) : undefined,
      query.departmentCode ? eq(departments.name, query.departmentCode) : undefined,
      query.programCode ? eq(programs.code, query.programCode) : undefined,
      query.slotName ? eq(electiveSlots.name, query.slotName) : undefined,
      query.programStatus && query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.academicYearState === "RECORDED" ? isNotNull(electiveSlots.academicYear) :
        query.academicYearState === "MISSING" ? isNull(electiveSlots.academicYear) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.semesterNumber !== undefined ? eq(electiveSlots.semesterNumber, query.semesterNumber) : undefined,
      query.offeringState === "HAS_ACTIVE" ? exists(db.select({id:electiveOfferings.id}).from(electiveOfferings).innerJoin(courses,eq(courses.id,electiveOfferings.courseId)).innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId))).where(and(eq(electiveOfferings.slotId,electiveSlots.id),eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))) :
        query.offeringState === "NONE_ACTIVE" ? not(exists(db.select({id:electiveOfferings.id}).from(electiveOfferings).innerJoin(courses,eq(courses.id,electiveOfferings.courseId)).innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId))).where(and(eq(electiveOfferings.slotId,electiveSlots.id),eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt))))) : undefined,
      query.choiceMode === "FLEXIBLE" ? ne(electiveSlots.minPick,electiveSlots.maxPick) :
        query.choiceMode === "FIXED" ? not(ne(electiveSlots.minPick,electiveSlots.maxPick)) : undefined,
      query.minimumCredits !== undefined ? gte(electiveSlots.credits,query.minimumCredits) : undefined,
      query.maximumCredits !== undefined ? lte(electiveSlots.credits,query.maximumCredits) : undefined,
      query.status === "ALL" ? undefined : eq(electiveSlots.status, query.status),
      query.periodState === "LINKED" ? isNotNull(electiveSlots.academicPeriodId) : query.periodState === "UNLINKED" ? isNull(electiveSlots.academicPeriodId) : undefined,
      query.q ? or(
        ilike(electiveSlots.name, searchPattern(query.q)),
        ilike(programs.name, searchPattern(query.q)),
        ilike(electiveSlots.description, searchPattern(query.q)),
      ) : undefined,
    )).as("college_structure_electives");

  const [totals, baseRows, programChoices] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.programName), asc(scoped.semesterNumber), asc(scoped.name), asc(scoped.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    scopedPrograms(collegeId),
  ]);
  const ids = baseRows.map(item => item.id);
  const counts = ids.length ? await db.select({
    slotId: electiveOfferings.slotId,
    total: count(),
  }).from(electiveOfferings)
    .innerJoin(courses, eq(courses.id, electiveOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .where(and(
      inArray(electiveOfferings.slotId, ids),
      eq(electiveOfferings.status, "ACTIVE"),
      isNull(electiveOfferings.deletedAt),
    ))
    .groupBy(electiveOfferings.slotId) : [];
  const confirmedStudents = ids.length ? await db.select({
    slotId:electiveOfferings.slotId,
    total:countDistinct(lmsGroupMembers.membershipId),
  }).from(electiveOfferings)
    .innerJoin(lmsGroupMembers, and(
      eq(lmsGroupMembers.groupId,electiveOfferings.groupId),
      eq(lmsGroupMembers.memberType,"LEARNER"),
      eq(lmsGroupMembers.state,"ACTIVE"),
    ))
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,lmsGroupMembers.membershipId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .where(and(inArray(electiveOfferings.slotId,ids),
      eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))
    .groupBy(electiveOfferings.slotId):[];
  const confirmedBySlot=new Map(confirmedStudents.map(row=>[row.slotId,row.total]));
  const offeringCount = new Map(counts.map(item => [item.slotId, item.total]));
  const items = baseRows.map(item => ({
    ...item,
    activeOfferings: offeringCount.get(item.id) ?? 0,
    confirmedStudents:confirmedBySlot.get(item.id)??0,
  }));
  const total = totals[0]?.total ?? 0;
  return {
    kind: "ELECTIVES" as const,
    query, items, total, programs: programChoices,
    totalPages: collegeStructureTotalPages(total, query.pageSize),
  };
}
