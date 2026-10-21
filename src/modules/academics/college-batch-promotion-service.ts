import "server-only";

import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohortProgressionState, cohorts, collegeMemberships, colleges,
  departments, learnerProgramEnrollments, membershipRoles, programs,
  programTermCourses, programTerms, sectionEnrollments, sections, users,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  batchPromotionPlan, collegePromotionQuerySchema, formatPromotionAcademicYear, promotionLearnerBlockers,
  type PromotionBlocker,
} from "./college-batch-promotion-model";

export class CollegePromotionPreviewError extends Error {
  constructor(public readonly code: "BATCH_NOT_FOUND" | "PROGRAM_NOT_FOUND") {
    super(code); this.name = "CollegePromotionPreviewError";
  }
}

function ownCollege(context: RequestContext) {
  // This module's exported preview functions do not write. Execute lives in
  // college-batch-promotion-execute.ts and still requires COLLEGE_ADMIN.
  if (isSuperAdmin(context) && context.adminScope?.collegeId) {
    requirePermission(context, "academics.read", {
      organizationId: context.adminScope.organizationId,
      collegeId: context.adminScope.collegeId,
    });
    return { collegeId: context.adminScope.collegeId,
      organizationId: context.adminScope.organizationId };
  }
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "academics.manage", {
        collegeId: member.collegeId, organizationId: member.organizationId,
      })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  return member;
}

/** Registered options are always tenant-owned. When paging is supplied, the
 * database bounds the cohort query BEFORE rendering rather than slicing a
 * potentially enormous list in the server component.
 *
 * Existing read-only call sites without paging keep their full directory
 * contract for backward-compatible preview pickers.
 */
export async function listCollegePromotionOptions(
  context: RequestContext, raw: unknown,
  paging?: { page: number; pageSize: number; includeInactive?: boolean },
) {
  const query = collegePromotionQuerySchema.parse(raw);
  const member = ownCollege(context);
  const db = getDb();
  const page = paging ? Math.max(1, Math.min(Math.trunc(paging.page) || 1, 10000)) : 1;
  const pageSize = paging ? Math.max(1, Math.min(Math.trunc(paging.pageSize) || 10, 100)) : 0;
  const visibility = paging && !paging.includeInactive ? eq(cohorts.status, "ACTIVE") : undefined;
  const where = and(
    query.programId ? eq(programs.id, query.programId) : undefined, visibility,
  );
  const programQuery = db.select({ id: programs.id, name: programs.name, code: programs.code })
    .from(programs).innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    )).orderBy(asc(programs.name));
  const cohortQuery = db.select({
    id: cohorts.id, name: cohorts.name, status: cohorts.status,
    academicYear: cohorts.academicYear, startDate: cohorts.startDate, endDate: cohorts.endDate,
    programId: programs.id, programName: programs.name,
    durationTerms: programs.durationTerms,
    currentTermNumber: cohortProgressionState.currentTermNumber,
    currentAcademicYearStart: cohortProgressionState.currentAcademicYearStart,
    // Legacy currentStudents counted learners assigned to a primary class,
    // not every program enrollment or an elective group membership. Distinct
    // enrollment membership IDs prevent duplicates across section history.
    activeClasses: sql<number>`(
      select count(*)::integer from sections sec
      where sec.cohort_id = ${cohorts.id} and sec.status = 'ACTIVE'
    )`.as("promotion_primary_classes"),
    activeLearners: sql<number>`(
      select count(distinct lpe.membership_id)::integer
      from learner_program_enrollments lpe
      inner join college_memberships cm
        on cm.id = lpe.membership_id and cm.status = 'ACTIVE'
        and cm.college_id = ${member.collegeId}::uuid
      inner join section_enrollments se
        on se.learner_enrollment_id = lpe.id and se.status = 'ACTIVE'
      inner join sections sec
        on sec.id = se.section_id and sec.cohort_id = ${cohorts.id}
        and sec.status = 'ACTIVE'
      where lpe.cohort_id = ${cohorts.id} and lpe.status = 'ACTIVE'
    )`.as("promotion_primary_class_learners"),
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    )).where(where)
    .orderBy(asc(programs.name), asc(cohorts.name));
  const countQuery = db.select({ total: count() }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    )).where(where);
  const [programChoices, cohortChoices, cohortCounts] = await Promise.all([
    programQuery,
    paging ? cohortQuery.limit(pageSize).offset((page - 1) * pageSize) : cohortQuery,
    countQuery,
  ]);
  return {
    programs: programChoices,
    cohorts: cohortChoices.map(cohort => ({
      ...cohort,
      // Legacy display defaults to semester one. The preview still requires
      // a persisted progression row before allowing a mutation.
      displayCurrentTermNumber: cohort.currentTermNumber ?? 1,
      progressionReady: cohort.currentTermNumber !== null,
      displayAcademicYear: cohort.academicYear ?? (
        cohort.currentAcademicYearStart === null ? null :
          formatPromotionAcademicYear(cohort.currentAcademicYearStart)
      ),
    })),
    totalCohorts: cohortCounts[0]?.total ?? 0,
    page, pageSize: paging ? pageSize : cohortChoices.length,
  };
}


/**
 * Super Admin-only read directory, distinct from the college-scoped mutation
 * preview. Filtering and pagination are applied in SQL; promotion actions
 * still require an explicitly selected acting college and a verified cohort.
 */
export async function listSuperAdminBatchDirectory(
  context: RequestContext,
  raw: { organizationId?: string; collegeId?: string; page?: number; pageSize?: number },
) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("academics.read");
  const organizationId = raw.organizationId ? z.uuid().parse(raw.organizationId) : undefined;
  const collegeId = raw.collegeId ? z.uuid().parse(raw.collegeId) : undefined;
  requirePermission(context, "academics.read", { organizationId, collegeId });
  const page = Math.max(1, Math.min(10000, Math.trunc(raw.page ?? 1) || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(raw.pageSize ?? 10) || 10));
  const where = and(
    organizationId ? eq(colleges.organizationId, organizationId) : undefined,
    collegeId ? eq(colleges.id, collegeId) : undefined,
  );
  const db = getDb();
  const scope = db.select({
    id: cohorts.id, name: cohorts.name, status: cohorts.status,
    academicYear: cohorts.academicYear, startDate: cohorts.startDate, endDate: cohorts.endDate,
    programId: programs.id, programName: programs.name,
    programCode: programs.code, durationTerms: programs.durationTerms,
    collegeId: colleges.id, organizationId: colleges.organizationId,
    currentTermNumber: cohortProgressionState.currentTermNumber,
    currentAcademicYearStart: cohortProgressionState.currentAcademicYearStart,
    activeClasses: sql<number>`(
      select count(*)::integer from sections sec
      where sec.cohort_id = ${cohorts.id} and sec.status = 'ACTIVE'
    )`.as("directory_active_classes"),
    activeLearners: sql<number>`(
      select count(distinct lpe.membership_id)::integer
      from learner_program_enrollments lpe
      inner join college_memberships cm on cm.id = lpe.membership_id
      where lpe.cohort_id = ${cohorts.id}
        and lpe.status = 'ACTIVE' and cm.status = 'ACTIVE'
        and cm.college_id = ${colleges.id}
    )`.as("directory_active_learners"),
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
    .where(where).orderBy(asc(colleges.id), asc(programs.name), asc(cohorts.name))
    .limit(pageSize).offset((page - 1) * pageSize);
  const totals = db.select({ total: count() }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .where(where);
  const [rows, countRows] = await Promise.all([scope, totals]);
  const total = countRows[0]?.total ?? 0;
  return { rows: rows.map(row => ({
    ...row,
    displayCurrentTermNumber: row.currentTermNumber ?? 1,
    progressionReady: row.currentTermNumber !== null,
    displayAcademicYear: row.academicYear ?? (
      row.currentAcademicYearStart === null ? null :
        formatPromotionAcademicYear(row.currentAcademicYearStart)
    ),
  })), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** No mutation, no enrollment changes, and no implied bulk promotion. */
export async function previewCollegeBatchPromotion(context: RequestContext, raw: unknown) {
  const query = collegePromotionQuerySchema.parse(raw);
  ownCollege(context);
  if (!query.cohortId) throw new CollegePromotionPreviewError("BATCH_NOT_FOUND");
  return previewCollegeBatchPromotionInTransaction(context, query, getDb());
}

type Reader = Pick<ReturnType<typeof getDb>, "select">;
export async function previewCollegeBatchPromotionInTransaction(
  context: RequestContext,
  query: ReturnType<typeof collegePromotionQuerySchema.parse>,
  db: Reader,
) {
  const member = ownCollege(context);
  if (!query.cohortId) throw new CollegePromotionPreviewError("BATCH_NOT_FOUND");
  const [batch] = await db.select({
    id: cohorts.id, name: cohorts.name, status: cohorts.status,
    academicYear: cohorts.academicYear, startDate: cohorts.startDate, endDate: cohorts.endDate,
    programId: programs.id, programName: programs.name,
    durationTerms: programs.durationTerms,
    currentTermNumber: cohortProgressionState.currentTermNumber,
    version: cohortProgressionState.version,
    currentAcademicYearStart: cohortProgressionState.currentAcademicYearStart,
    currentPeriodId: cohortProgressionState.currentPeriodId,
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    ))
    .leftJoin(cohortProgressionState, eq(cohortProgressionState.cohortId, cohorts.id))
    .where(and(eq(cohorts.id, query.cohortId),
      query.programId ? eq(programs.id, query.programId) : undefined))
    .limit(1);
  if (!batch) throw new CollegePromotionPreviewError("BATCH_NOT_FOUND");

  const nextTerm = batch.currentTermNumber === null ? null : batch.currentTermNumber + 1;
  const [availableTerm, matchingPeriod, students] = await Promise.all([
    nextTerm === null || nextTerm > batch.durationTerms ? Promise.resolve([]) :
      db.select({ id: programTerms.id }).from(programTerms)
        .where(and(eq(programTerms.programId, batch.programId),
          eq(programTerms.termNumber, nextTerm), eq(programTerms.isActive, true))).limit(1),
    batch.currentPeriodId === null ? Promise.resolve([]) :
      db.select({ collegeId: academicPeriods.collegeId }).from(academicPeriods)
        .where(eq(academicPeriods.id, batch.currentPeriodId)).limit(1),
    db.select({
      enrollmentId: learnerProgramEnrollments.id,
      membershipId: learnerProgramEnrollments.membershipId,
      enrollmentStatus: learnerProgramEnrollments.status,
      membershipStatus: collegeMemberships.status,
      accountStatus: users.platformStatus,
      displayName: users.displayName,
      learnerRole: membershipRoles.id,
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
        eq(collegeMemberships.collegeId, member.collegeId),
      ))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .leftJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(and(eq(learnerProgramEnrollments.cohortId, batch.id),
        eq(learnerProgramEnrollments.programId, batch.programId)))
      .orderBy(asc(users.displayName), asc(learnerProgramEnrollments.id))
      .limit(2001),
  ]);
  // COL-academic-setup-R04: an active next semester without any mapped
  // course cannot receive a batch. The execute path shares this preview
  // inside its progression transaction, and this FOR SHARE guards against
  // concurrent removal of the last mapping until that transaction commits.
  const mappedTargetCourses = availableTerm[0] && nextTerm !== null
    ? await db.select({id:programTermCourses.id}).from(programTermCourses)
      .where(eq(programTermCourses.programTermId,availableTerm[0].id))
      .for("share",{of:programTermCourses}).limit(1)
    : [];
  const tooMany = students.length > 2000;
  const visible = students.slice(0, 2000);
  const ids = visible.map(student => student.enrollmentId);
  const sectionsByEnrollment = ids.length > 0 && batch.currentPeriodId !== null
    ? await db.select({ id: sectionEnrollments.learnerEnrollmentId })
      .from(sectionEnrollments)
      .innerJoin(sections, and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.cohortId, batch.id),
        eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
        eq(sections.status, "ACTIVE"),
      ))
      .where(and(
        inArray(sectionEnrollments.learnerEnrollmentId, ids),
        eq(sectionEnrollments.academicPeriodId, batch.currentPeriodId),
        eq(sectionEnrollments.status, "ACTIVE"),
      ))
    : [];
  const withClass = new Set(sectionsByEnrollment.map(row => row.id));
  const plan = batchPromotionPlan({
    cohortStatus: batch.status,
    currentTermNumber: batch.currentTermNumber,
    durationTerms: batch.durationTerms,
    nextTermConfigured: availableTerm.length > 0,
    nextTermHasCourses: mappedTargetCourses.length > 0,
    currentYearStart: batch.currentAcademicYearStart,
    overrideYearStart: query.yearStart,
    currentPeriodConfigured: batch.currentPeriodId !== null,
    currentPeriodOwned: matchingPeriod[0]?.collegeId === member.collegeId,
  });
  const blockers: PromotionBlocker[] = [...plan.blockers];
  if (visible.length === 0) blockers.push("NO_LEARNERS");
  if (tooMany) blockers.push("PREVIEW_TOO_LARGE");
  const learners = visible.map(student => ({
    membershipId: student.membershipId,
    name: student.displayName || "Unnamed learner",
    enrollmentStatus: student.enrollmentStatus,
    blockers: promotionLearnerBlockers({
      enrollmentStatus: student.enrollmentStatus,
      membershipStatus: student.membershipStatus,
      accountStatus: student.accountStatus,
      hasLearnerRole: student.learnerRole !== null,
      hasActiveClass: withClass.has(student.enrollmentId),
      periodConfigured: batch.currentPeriodId !== null,
    }),
  }));
  return {
    batch, plan, blockers,
    learners, completePreview: !tooMany,
    checkedLearners: learners.length,
    blockedLearners: learners.filter(row => row.blockers.length > 0).length,
    canProceed: false as const,
    // Intentionally never actionable: a separate guarded promotion mutation is needed.
    simulatedReadiness: blockers.length === 0 && learners.every(row => row.blockers.length === 0),
  };
}
