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
      creditSum: sql<number>`sum(coalesce(${programTermCourses.credits},${courses.credits},0))::integer`.mapWith(Number),
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
    programId: aliasedColumn(programs.id, "batch_program_id"),
    programName: aliasedColumn(programs.name, "batch_program_name"),
    programCode: aliasedColumn(programs.code, "batch_program_code"),
    startPeriodName: aliasedColumn(academicPeriods.name, "batch_start_period_name"),
    startDate: sql<string>`coalesce(${cohorts.startDate},${academicPeriods.startDate})`.as("batch_start_date"),
    academicYear:aliasedColumn(cohorts.academicYear,"batch_legacy_academic_year"),
    inactiveAt:aliasedColumn(cohorts.inactiveAt,"batch_inactive_at"),
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
