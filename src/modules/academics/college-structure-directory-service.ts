import "server-only";

import { and, asc, count, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
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
  membershipRoles,
  programs,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_STRUCTURE_PAGE_SIZE,
  collegeStructureQuerySchema,
  collegeClassQuerySchema,
  collegeElectiveQuerySchema,
  collegeStructureTotalPages,
} from "./college-structure-directory-model";

function ownCollege(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.read", {
      organizationId: membership.organizationId,
      collegeId: membership.collegeId,
    })) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership.collegeId;
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
  const collegeId = ownCollege(context);
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
    programId: sql<string>`${programs.id}`.as("class_program_id"),
    programName: sql<string>`${programs.name}`.as("class_program_name"),
    cohortName: sql<string>`${cohorts.name}`.as("class_cohort_name"),
    periodName: sql<string>`${academicPeriods.name}`.as("class_period_name"),
  }).from(sections)
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, sections.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      query.programId ? eq(programs.id, query.programId) : undefined,
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
      ) : undefined,
    )).as("college_structure_classes");

  const [totals, baseRows, programChoices] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.programName), asc(scoped.cohortName), asc(scoped.name), asc(scoped.id))
      .limit(COLLEGE_STRUCTURE_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_STRUCTURE_PAGE_SIZE),
    scopedPrograms(collegeId),
  ]);
  const ids = baseRows.map(row => row.id);
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
    .groupBy(sectionEnrollments.sectionId) : [];
  const countById = new Map(counts.map(item => [item.sectionId, item.enrolled]));
  const items = baseRows.map(item => ({
    ...item,
    activeLearners: countById.get(item.id) ?? 0,
  }));
  const total = totals[0]?.total ?? 0;
  return {
    kind: "CLASSES" as const,
    query, items, total, programs: programChoices,
    totalPages: collegeStructureTotalPages(total),
  };
}

/** Registered elective slot directory. Not a learner-selection or feature-enablement claim. */
export async function listCollegeElectives(context: RequestContext, raw: unknown) {
  const query = collegeElectiveQuerySchema.parse(raw);
  const collegeId = ownCollege(context);
  const db = getDb();
  const scoped = db.select({
    id: electiveSlots.id,
    name: electiveSlots.name,
    semesterNumber: electiveSlots.semesterNumber,
    academicYear: electiveSlots.academicYear,
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
      ) : undefined,
    )).as("college_structure_electives");

  const [totals, baseRows, programChoices] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.programName), asc(scoped.semesterNumber), asc(scoped.name), asc(scoped.id))
      .limit(COLLEGE_STRUCTURE_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_STRUCTURE_PAGE_SIZE),
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
  const offeringCount = new Map(counts.map(item => [item.slotId, item.total]));
  const items = baseRows.map(item => ({
    ...item,
    activeOfferings: offeringCount.get(item.id) ?? 0,
  }));
  const total = totals[0]?.total ?? 0;
  return {
    kind: "ELECTIVES" as const,
    query, items, total, programs: programChoices,
    totalPages: collegeStructureTotalPages(total),
  };
}
