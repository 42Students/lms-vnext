import "server-only";

import { and, asc, count, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { exists, not } from "drizzle-orm";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
import {
  academicPeriods,
  activityEvents,
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

/** Bounded Levenshtein fallback for the legacy typo-tolerant picker.
 * Only runs after a college-scoped read; it never searches across tenants. */
function withinTwoEdits(a: string, b: string) {
  const left=a.toLocaleLowerCase("en-IN").trim().slice(0,100);
  const right=b.toLocaleLowerCase("en-IN").trim().slice(0,100);
  if (Math.abs(left.length-right.length)>2) return false;
  let previous=Array.from({length:right.length+1},(_,index)=>index);
  for(let i=1;i<=left.length;i++){
    const row=[i];
    let rowMin=i;
    for(let j=1;j<=right.length;j++){
      const cost=left[i-1]===right[j-1]?0:1;
      const value=Math.min(row[j-1]!+1,previous[j]!+1,previous[j-1]!+cost);
      row.push(value);rowMin=Math.min(rowMin,value);
    }
    if(rowMin>2)return false;
    previous=row;
  }
  return previous[right.length]!<=2;
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
    legacySemesterId: aliasedColumn(programTerms.legacySemesterId, "sem_legacy_id"),
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

  // Stable program / semester-number ordering matches the legacy structure view.
  const [totalRead,itemsRead,programsRead] = await Promise.allSettled([
    db.select({ total: count() }).from(source),
    db.select().from(source)
      .orderBy(asc(source.programName), asc(source.termNumber), asc(source.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    availablePrograms(collegeId),
  ]);
  if(totalRead.status==="rejected"||itemsRead.status==="rejected")
    throw new Error("SEMESTERS_UNAVAILABLE");
  if(programsRead.status==="rejected")throw new Error("PROGRAMS_UNAVAILABLE");
  const totalRows=totalRead.value,rawItems=itemsRead.value,programChoices=programsRead.value;
  const ids = rawItems.map((item) => item.id);
  const mappedCourseSummaries = ids.length ? await db.select({
    termId: programTermCourses.programTermId,
    courseId: courses.id, courseName: courses.name, courseCode: courses.code,
    credits: programTermCourses.credits,
    type: programTermCourses.type,
    displayOrder: programTermCourses.displayOrder,
  }).from(programTermCourses)
    .innerJoin(courses,eq(courses.id,programTermCourses.courseId))
    .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
    .where(inArray(programTermCourses.programTermId,ids))
    .orderBy(asc(programTermCourses.displayOrder),asc(programTermCourses.id)) : [];
  const mappedByTerm=new Map<string,typeof mappedCourseSummaries>();
  for(const row of mappedCourseSummaries){
    const mapped=mappedByTerm.get(row.termId)??[];
    mapped.push(row);mappedByTerm.set(row.termId,mapped);
  }
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
    mappedCourseSummaries: mappedByTerm.get(item.id)??[],
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


/** Authoritative per-program semester structure including embedded course
 * summaries. Unlike the management directory this remains unpaged, and is
 * available only after validating the program belongs to the acting college.
 */
export async function listCollegeProgramSemesterStructure(
  context: RequestContext, rawProgramId: unknown,
) {
  const programId=z.uuid().parse(rawProgramId);
  const collegeId=await requireAdminCollege(context);
  const db=getDb();
  const [scope]=await db.select({id:programs.id,name:programs.name})
    .from(programs).innerJoin(departments,and(
      eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId),
    )).where(eq(programs.id,programId)).limit(1);
  if(!scope)throw new Error("PROGRAM_NOT_FOUND");
  const terms=await db.select({
    id:programTerms.id,legacySemesterId:programTerms.legacySemesterId,
    programId:programTerms.programId,name:programTerms.name,
    semesterNumber:programTerms.termNumber,isActive:programTerms.isActive,
    totalCredits:programTerms.totalCredits,
  }).from(programTerms).where(eq(programTerms.programId,programId))
    .orderBy(asc(programTerms.termNumber),asc(programTerms.id));
  const ids=terms.map(term=>term.id);
  const mapped=ids.length?await db.select({
    termId:programTermCourses.programTermId,id:programTermCourses.id,
    courseId:courses.id,courseName:courses.name,courseCode:courses.code,
    credits:programTermCourses.credits,type:programTermCourses.type,
    displayOrder:programTermCourses.displayOrder,
  }).from(programTermCourses).innerJoin(courses,eq(courses.id,programTermCourses.courseId))
    .innerJoin(departments,and(eq(departments.id,courses.departmentId),
      eq(departments.collegeId,collegeId)))
    .where(inArray(programTermCourses.programTermId,ids))
    .orderBy(asc(programTermCourses.displayOrder),asc(programTermCourses.id)): [];
  return {program:scope,semesters:terms.map(term=>({
    ...term,courses:mapped.filter(row=>row.termId===term.id),
  }))};
}

/** Old name-exists check, against a selected college and optional program. */
export async function collegeSemesterNameExists(
  context: RequestContext, rawName: unknown, rawProgramId?: unknown,
) {
  const name=z.string().trim().min(1).max(255).parse(rawName);
  const programId=rawProgramId===undefined?undefined:z.uuid().parse(rawProgramId);
  const collegeId=await requireAdminCollege(context);
  const rows=await getDb().select({id:programTerms.id})
    .from(programTerms).innerJoin(programs,eq(programs.id,programTerms.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)))
    .where(and(programId?eq(programTerms.programId,programId):undefined,
      sql<boolean>`lower(trim(${programTerms.name})) = ${name.toLocaleLowerCase("en-IN")}`))
    .limit(1);
  return {exists:rows.length>0};
}

/** Same-college exact batch-name presence check without disclosing an ID. */
export async function collegeBatchNameExists(
  context:RequestContext,rawName:unknown,rawProgramId?:unknown,
) {
  const name=z.string().trim().min(1).max(255).parse(rawName);
  const programId=rawProgramId===undefined?undefined:z.uuid().parse(rawProgramId);
  const collegeId=await requireAdminCollege(context);
  const rows=await getDb().select({id:cohorts.id})
    .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)))
    .where(and(programId?eq(cohorts.programId,programId):undefined,
      sql<boolean>`lower(trim(${cohorts.name})) = ${name.toLocaleLowerCase("en-IN")}`))
    .limit(1);
  return {exists:rows.length>0};
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
    .orderBy(
      q ? asc(programs.name) : sql`(select count(*) from ${activityEvents}
        where ${activityEvents.subjectType}='cohort'
          and ${activityEvents.eventType}='academics.batch.selected'
          and ${activityEvents.subjectId}=${cohorts.id}::text
          and ${activityEvents.collegeId}=${collegeId}::uuid) desc`,
      asc(programs.name), asc(cohorts.name), asc(cohorts.id),
    ).limit(bounded);
}

/** Legacy /batches/:id/select equivalent. It records a non-identifying
 * selection event only after checking the selected college and batch UUID.
 * This feeds popular autocomplete ordering; it never changes batch data. */
export async function recordCollegeBatchSearchSelection(
  context:RequestContext,rawId:unknown,
){
 const cohortId=z.string().uuid().parse(rawId);
 const actor=await resolveActingCollege(context,"academics.read");
 const [batch]=await getDb().select({
  id:cohorts.id,name:cohorts.name,
 }).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
     eq(departments.collegeId,actor.collegeId)))
   .where(eq(cohorts.id,cohortId)).limit(1);
 if(!batch)throw new Error("BATCH_NOT_FOUND");
 await getDb().insert(activityEvents).values({
  organizationId:actor.organizationId,collegeId:actor.collegeId,
  module:"ACADEMICS",eventType:"academics.batch.selected",
  subjectType:"cohort",subjectId:batch.id,
  subjectLabel:batch.name,summary:"Batch selected from search",
  metadata:{origin:"COLLEGE_BATCH_AUTOCOMPLETE"},
 });
 return {recorded:true as const};
}

export async function searchCollegeSemesterAutocomplete(
  context: RequestContext, search: string, programId?: string, limit = 20,
) {
  const collegeId = await requireAdminCollege(context);
  const q = search.trim().slice(0, 100);
  const program = programId ? z.uuid().parse(programId) : undefined;
  const bounded = Math.max(1, Math.min(Math.trunc(limit) || 20, 50));
  const db=getDb();
  const fields={
    id: programTerms.id, name: programTerms.name,
    semesterNumber: programTerms.termNumber,
    programId: programs.id, programName: programs.name,
    collegeId: departments.collegeId,
    isActive: programTerms.isActive,
  };
  const base=()=>db.select(fields).from(programTerms)
    .innerJoin(programs,eq(programs.id,programTerms.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,collegeId)));
  const matches=await base().where(and(
    program?eq(programTerms.programId,program):undefined,
    q?or(ilike(programTerms.name,likePattern(q)),
      ilike(programs.name,likePattern(q)),
      sql<boolean>`${programTerms.termNumber}::text ilike ${likePattern(q)}`):undefined,
  )).orderBy(asc(programs.name),asc(programTerms.termNumber))
    .limit(bounded);
  if(q.length<3||matches.length>=bounded)return matches;
  // Legacy search tolerates up to two typos. Bound the fallback to 500
  // authorized rows, rank exact/substring results before typo matches, and
  // never rank candidates outside the chosen program/college.
  const candidates=await base().where(
    program?eq(programTerms.programId,program):undefined,
  ).orderBy(asc(programs.name),asc(programTerms.termNumber)).limit(500);
  const seen=new Set(matches.map(row=>row.id));
  const fuzzy=candidates.filter(row=>!seen.has(row.id)&&(
    withinTwoEdits(q,row.name)||withinTwoEdits(q,row.programName)
  ));
  return [...matches,...fuzzy].slice(0,bounded);
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
