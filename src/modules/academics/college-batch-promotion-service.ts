import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohortProgressionState, cohorts, collegeMemberships,
  departments, learnerProgramEnrollments, membershipRoles, programs,
  programTermCourses, programTerms, sectionEnrollments, sections, users,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  batchPromotionPlan, collegePromotionQuerySchema, promotionLearnerBlockers,
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

/** All options come from registered, tenant-owned programs and cohorts. */
export async function listCollegePromotionOptions(context: RequestContext, raw: unknown) {
  const query = collegePromotionQuerySchema.parse(raw);
  const member = ownCollege(context);
  const db = getDb();
  const [programChoices, cohortChoices] = await Promise.all([
    db.select({ id: programs.id, name: programs.name, code: programs.code })
      .from(programs).innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
      )).orderBy(asc(programs.name)),
    db.select({
      id: cohorts.id, name: cohorts.name, status: cohorts.status,
      programId: programs.id, programName: programs.name,
      currentTermNumber: cohortProgressionState.currentTermNumber,
      currentAcademicYearStart: cohortProgressionState.currentAcademicYearStart,
      activeLearners: sql<number>`(select count(*)::integer from learner_program_enrollments lpe where lpe.cohort_id = ${cohorts.id} and lpe.status = 'ACTIVE')`.as("promotion_active_learners"),
    }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .leftJoin(cohortProgressionState,eq(cohortProgressionState.cohortId,cohorts.id))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
      )).where(query.programId ? eq(programs.id, query.programId) : undefined)
      .orderBy(asc(programs.name), asc(cohorts.name)),
  ]);
  return { programs: programChoices, cohorts: cohortChoices };
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
