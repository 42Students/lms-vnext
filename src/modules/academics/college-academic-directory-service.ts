import "server-only";

import { and, asc, count, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { exists, not } from "drizzle-orm";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
import {
  academicPeriods,
  cohortProgressionState,
  cohorts,
  collegeMemberships,
  colleges,
  groupBackedClassOfferings,
  lmsGroups,
  courses,
  departments,
  learnerProgramEnrollments,
  programTermCourses,
  programTerms,
  programs,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

import {
  academicDirectoryPageCount,
  COLLEGE_ACADEMIC_PAGE_SIZE,
  collegeBatchDirectorySchema,
  collegeSemesterDirectorySchema,
} from "./college-academic-directory-model";

async function requireAdminCollege(context: RequestContext) {
  const selected = await resolveActingCollege(context, "academics.read");
  return selected.collegeId;
}

function likePattern(text: string): string {
  return "%" + text.replace(/[\\%_]/g, "\\$&") + "%";
}

function availablePrograms(collegeId: string) {
  return getDb().select({
    id: programs.id,
    name: programs.name,
    code: programs.code,
    status: programs.status,
  }).from(programs)
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .orderBy(asc(programs.name), asc(programs.id));
}

/** Registered DB-0050 program_terms, not a fabricated academic period ordinal. */
export async function listCollegeSemesters(context: RequestContext, raw: unknown) {
  const query = collegeSemesterDirectorySchema.parse(raw);
  const collegeId = await requireAdminCollege(context);
  const db = getDb();
  const source = db.select({
    id: aliasedColumn(programTerms.id, "sem_id"),
    updatedAt: sql<Date>`${programTerms.updatedAt}`.mapWith(programTerms.updatedAt).as("term_updated_at"),
    name: aliasedColumn(programTerms.name, "sem_name"),
    termNumber: aliasedColumn(programTerms.termNumber, "sem_term_number"),
    totalCredits: aliasedColumn(programTerms.totalCredits, "sem_total_credits"),
    isActive: aliasedColumn(programTerms.isActive, "sem_is_active"),
    programName: aliasedColumn(programs.name, "sem_program_name"),
    programCode: aliasedColumn(programs.code, "sem_program_code"),
    programId: aliasedColumn(programs.id, "sem_program_id"),
  }).from(programTerms)
    .innerJoin(programs, eq(programs.id, programTerms.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .where(and(
      query.programId ? eq(programs.id, query.programId) : undefined,
      query.termNumber !== undefined ? eq(programTerms.termNumber, query.termNumber) : undefined,
      query.minimumCredits !== undefined ? gte(programTerms.totalCredits,query.minimumCredits) : undefined,
      query.maximumCredits !== undefined ? lte(programTerms.totalCredits,query.maximumCredits) : undefined,
      query.creditState === "CONFIGURED" ? isNotNull(programTerms.totalCredits) :
        query.creditState === "UNSET" ? isNull(programTerms.totalCredits) : undefined,
      query.status === "ALL" ? undefined
        : eq(programTerms.isActive, query.status === "ACTIVE"),
      query.programStatus && query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.mappingState === "MAPPED" ? exists(db.select({id:programTermCourses.id}).from(programTermCourses)
        .innerJoin(courses,eq(courses.id,programTermCourses.courseId))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
        .where(eq(programTermCourses.programTermId,programTerms.id))) :
        query.mappingState === "UNMAPPED" ? not(exists(db.select({id:programTermCourses.id}).from(programTermCourses)
          .innerJoin(courses,eq(courses.id,programTermCourses.courseId))
          .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
          .where(eq(programTermCourses.programTermId,programTerms.id)))) : undefined,
      query.q ? or(
        ilike(programTerms.name, likePattern(query.q)),
        ilike(programs.name, likePattern(query.q)),
        ilike(programs.code, likePattern(query.q)),
        sql<boolean>`${programTerms.termNumber}::text ilike ${likePattern(query.q)}`,
      ) : undefined,
    )).as("college_semester_directory");

  const [totalRows, rawItems, programChoices] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source)
      .orderBy(asc(source.programName), asc(source.termNumber), asc(source.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    availablePrograms(collegeId),
  ]);
  const ids = rawItems.map((item) => item.id);
  const courseCounts = ids.length
    ? await db.select({
      id: programTermCourses.programTermId,
      total: count(),
      creditSum: sql<number>`sum(coalesce(${programTermCourses.credits},0))::integer`.mapWith(Number),
    }).from(programTermCourses)
      .innerJoin(courses, eq(courses.id, programTermCourses.courseId))
      .innerJoin(departments, and(
        eq(departments.id, courses.departmentId),
        eq(departments.collegeId, collegeId),
      ))
      .where(inArray(programTermCourses.programTermId, ids))
      .groupBy(programTermCourses.programTermId)
    : [];
  const countMap = new Map(courseCounts.map((item) => [item.id, item.total]));
  const creditMap = new Map(courseCounts.map((item) => [item.id, item.creditSum]));
  const items = rawItems.map((item) => ({
    ...item,
    mappedCourses: countMap.get(item.id) ?? 0,
    mappedCredits: countMap.has(item.id)?creditMap.get(item.id)??0:null,
  }));
  const total = totalRows[0]?.total ?? 0;
  return {
    kind: "SEMESTERS" as const,
    query,
    items,
    programs: programChoices,
    total,
    totalPages: academicDirectoryPageCount(total, query.pageSize),
  };
}

/** Registered cohorts, DB-0051 progression, and active membership-scoped learner counts. */
export async function listCollegeBatches(context: RequestContext, raw: unknown) {
  const query = collegeBatchDirectorySchema.parse(raw);
  const collegeId = await requireAdminCollege(context);
  const db = getDb();
  const source = db.select({
    id: aliasedColumn(cohorts.id, "batch_id"),
    name: aliasedColumn(cohorts.name, "batch_name"),
    code: aliasedColumn(cohorts.code, "batch_code"),
    status: aliasedColumn(cohorts.status, "batch_status"),
    updatedAt: aliasedColumn(cohorts.updatedAt, "batch_updated_at"),
    expectedEndPeriodId: aliasedColumn(cohorts.expectedEndPeriodId, "batch_expected_end_period_id"),
    academicYear:aliasedColumn(cohorts.academicYear,"batch_academic_year"),
    legacyStartDate:aliasedColumn(cohorts.startDate,"batch_legacy_start_date"),
    legacyEndDate:aliasedColumn(cohorts.endDate,"batch_legacy_end_date"),
    inactiveAt:aliasedColumn(cohorts.inactiveAt,"batch_inactive_at"),
    programId: aliasedColumn(programs.id, "batch_program_id"),
    programName: aliasedColumn(programs.name, "batch_program_name"),
    programCode: aliasedColumn(programs.code, "batch_program_code"),
    startPeriodName: aliasedColumn(academicPeriods.name, "batch_start_period_name"),
    startDate: sql<string>`coalesce(${cohorts.startDate},${academicPeriods.startDate})`.as("batch_start_date"),
    endDate: sql<string | null>`coalesce(${cohorts.endDate},(select ap.end_date from academic_periods ap where ap.id = ${cohorts.expectedEndPeriodId}))`.as("batch_end_date"),

    startPeriodId: aliasedColumn(academicPeriods.id, "batch_start_period_id"),
    currentTermNumber: aliasedColumn(cohortProgressionState.currentTermNumber, "batch_current_term_number"),
    currentAcademicYearStart: aliasedColumn(cohortProgressionState.currentAcademicYearStart, "batch_current_academic_year_start"),
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, cohorts.startPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
    .where(and(
      query.programId ? eq(programs.id, query.programId) : undefined,
      query.programStatus && query.programStatus !== "ALL" ? eq(programs.status,query.programStatus) : undefined,
      query.startOnOrAfter ? gte(academicPeriods.startDate,query.startOnOrAfter) : undefined,
      query.startOnOrBefore ? lte(academicPeriods.startDate,query.startOnOrBefore) : undefined,
      query.yearStart !== undefined ? eq(cohortProgressionState.currentAcademicYearStart, query.yearStart) : undefined,
      query.currentTerm !== undefined ? eq(cohortProgressionState.currentTermNumber, query.currentTerm) : undefined,
      query.progression === "RECORDED" ? isNotNull(cohortProgressionState.cohortId) :
        query.progression === "MISSING" ? isNull(cohortProgressionState.cohortId) : undefined,
      query.status === "ALL" ? undefined : query.status === "INACTIVE" ? inArray(cohorts.status, ["PLANNED", "ARCHIVED"]) : eq(cohorts.status, query.status),
      query.activeLearnerState === "HAS_ACTIVE" ? exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments).innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"))).where(and(eq(learnerProgramEnrollments.cohortId,cohorts.id),eq(learnerProgramEnrollments.status,"ACTIVE")))) :
        query.activeLearnerState === "NONE_ACTIVE" ? not(exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments).innerJoin(collegeMemberships,and(eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"))).where(and(eq(learnerProgramEnrollments.cohortId,cohorts.id),eq(learnerProgramEnrollments.status,"ACTIVE"))))) : undefined,
      query.activeClassState === "HAS_ACTIVE" ? exists(db.select({id:sections.id}).from(sections).where(and(eq(sections.cohortId,cohorts.id),eq(sections.status,"ACTIVE")))) :
        query.activeClassState === "NONE_ACTIVE" ? not(exists(db.select({id:sections.id}).from(sections).where(and(eq(sections.cohortId,cohorts.id),eq(sections.status,"ACTIVE"))))) : undefined,
      query.expectedEndState === "SET" ? isNotNull(cohorts.expectedEndPeriodId) : query.expectedEndState === "UNSET" ? isNull(cohorts.expectedEndPeriodId) : undefined,
      query.academicYearState === "RECORDED" ? isNotNull(cohortProgressionState.currentAcademicYearStart) : query.academicYearState === "UNRECORDED" ? isNull(cohortProgressionState.currentAcademicYearStart) : undefined,
      query.q ? or(
        ilike(cohorts.name, likePattern(query.q)),
        ilike(cohorts.code, likePattern(query.q)),
        ilike(programs.name, likePattern(query.q)),
        ilike(cohorts.academicYear, likePattern(query.q)),
        sql<boolean>`${cohorts.status}::text ilike ${likePattern(query.q)}`,
        sql<boolean>`${cohortProgressionState.currentTermNumber}::text ilike ${likePattern(query.q)}`,
      ) : undefined,
    )).as("college_batches_directory");

  const [totalRows, rawItems, programChoices] = await Promise.all([
    db.select({ total: count() }).from(source),
    db.select().from(source)
      .orderBy(asc(source.programName), asc(source.name), asc(source.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    availablePrograms(collegeId),
  ]);
  const ids = rawItems.map((item) => item.id);
  const [sectionCounts, learnerCounts] = await Promise.all([
    ids.length ? db.select({
      cohortId: sections.cohortId,
      total: count(),
    }).from(sections)
      .where(and(inArray(sections.cohortId, ids), eq(sections.status, "ACTIVE")))
      .groupBy(sections.cohortId) : Promise.resolve([]),
    ids.length ? db.select({
      cohortId: learnerProgramEnrollments.cohortId,
      total: count(),
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ))
      .where(and(
        inArray(learnerProgramEnrollments.cohortId, ids),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      ))
      .groupBy(learnerProgramEnrollments.cohortId) : Promise.resolve([]),
  ]);
  const sectionsMap = new Map(sectionCounts.map((item) => [item.cohortId, item.total]));
  const learnersMap = new Map(learnerCounts.map((item) => [item.cohortId, item.total]));
  const items = rawItems.map((item) => ({
    ...item,
    activeSections: sectionsMap.get(item.id) ?? 0,
    activeEnrolledLearners: learnersMap.get(item.id) ?? 0,
    startDate:item.legacyStartDate??item.startDate,
    endDate:item.legacyEndDate??item.endDate,
  }));
  const total = totalRows[0]?.total ?? 0;
  return {
    kind: "BATCHES" as const,
    query,
    items,
    programs: programChoices,
    total,
    totalPages: academicDirectoryPageCount(total, query.pageSize),
  };
}


/**
 * Legacy autocomplete is independent of the paged management directory.
 * Only UUID identifiers scoped to the acting college are returned: imported
 * numeric college/program/batch IDs are never accepted as tenant selectors.
 */
export async function searchCollegeBatchAutocomplete(
  context: RequestContext, search: string, limit = 20,
) {
  const collegeId = await requireAdminCollege(context);
  const q = search.trim().slice(0, 100);
  const bounded = Math.max(1, Math.min(Math.trunc(limit) || 20, 50));
  const db = getDb();
  return db.select({
    id: cohorts.id, name: cohorts.name, code: cohorts.code,
    programId: programs.id, programName: programs.name,
    collegeId: colleges.id, organizationId: colleges.organizationId,
    startDate: cohorts.startDate, endDate: cohorts.endDate,
    academicYear: cohorts.academicYear, status: cohorts.status,
    semesterNumber: cohortProgressionState.currentTermNumber,
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId)))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
    .where(q ? or(
      ilike(cohorts.name, likePattern(q)), ilike(cohorts.code, likePattern(q)),
      ilike(programs.name, likePattern(q)), ilike(cohorts.academicYear, likePattern(q)),
      sql<boolean>`${cohortProgressionState.currentTermNumber}::text ilike ${likePattern(q)}`,
    ) : undefined)
    .orderBy(asc(programs.name), asc(cohorts.name)).limit(bounded);
}

export async function searchCollegeSemesterAutocomplete(
  context: RequestContext, search: string, programId?: string, limit = 20,
) {
  const collegeId = await requireAdminCollege(context);
  const q = search.trim().slice(0, 100);
  const bounded = Math.max(1, Math.min(Math.trunc(limit) || 20, 50));
  return getDb().select({
    id: programTerms.id, name: programTerms.name,
    semesterNumber: programTerms.termNumber,
    programId: programs.id, programName: programs.name,
    collegeId: departments.collegeId,
    isActive: programTerms.isActive,
  }).from(programTerms)
    .innerJoin(programs, eq(programs.id, programTerms.programId))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId)))
    .where(and(
      programId ? eq(programTerms.programId, programId) : undefined,
      q ? or(ilike(programTerms.name, likePattern(q)),
        ilike(programs.name, likePattern(q)),
        sql<boolean>`${programTerms.termNumber}::text ilike ${likePattern(q)}`) : undefined,
    ))
    .orderBy(asc(programs.name), asc(programTerms.termNumber)).limit(bounded);
}

/**
 * Content audience enumeration, not the management class list. GROUP_BACKED
 * entries remain separate from primary sections and never inflate batch
 * section/learner totals.
 */
export async function listCollegeContentClassAudience(context: RequestContext) {
  const collegeId = await requireAdminCollege(context);
  const db = getDb();
  const [registered, grouped] = await Promise.all([
    db.select({
      id: sections.id, name: sections.name,
      academicPeriodId: sections.academicPeriodId,
    }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, collegeId)))
      .where(eq(sections.status, "ACTIVE")),
    db.select({
      id: groupBackedClassOfferings.id, name: groupBackedClassOfferings.name,
      academicPeriodId: groupBackedClassOfferings.academicPeriodId,
    }).from(groupBackedClassOfferings)
      .innerJoin(lmsGroups, and(eq(lmsGroups.id, groupBackedClassOfferings.rosterGroupId),
        eq(lmsGroups.collegeId, collegeId)))
      .innerJoin(academicPeriods, and(
        eq(academicPeriods.id, groupBackedClassOfferings.academicPeriodId),
        eq(academicPeriods.collegeId, collegeId)))
      .where(and(eq(groupBackedClassOfferings.status, "ACTIVE"),
        eq(lmsGroups.status, "ACTIVE"),
        isNull(lmsGroups.deletedAt))),
  ]);
  return [
    ...registered.map(row => ({...row, kind: "SECTION" as const})),
    ...grouped.map(row => ({...row, kind: "GROUP_BACKED" as const})),
  ];
}
