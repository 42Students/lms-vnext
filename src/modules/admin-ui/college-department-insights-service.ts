import "server-only";

import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceRecords,
  attendanceSessions,
  cohorts,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  placementCandidateAcademicEvidence,
  placementCandidatePreferences,
  programs,
  sectionScheduleEvents,
  sections,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import {requireAttendanceCollege} from "@/modules/attendance/admin-service";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_DEPARTMENT_INSIGHTS_PAGE_SIZE,
  collegeDepartmentInsightsQuerySchema,
  departmentInsightsPageCount,
  type DepartmentInsightsKind,
} from "./college-department-insights-model";

async function requireCollegeDepartmentInsightAccess(
  context: RequestContext,
  kind: DepartmentInsightsKind,
) {
  // Super Admin attendance routes share the same explicit acting-college
  // authorization as the main Attendance page. Placement readiness stays
  // restricted to a real College Admin membership.
  if (kind === "ATTENDANCE" && isSuperAdmin(context)) {
    if (!context.adminScope?.collegeId) throw new AuthorizationError("academics.read");
    const college = await requireAttendanceCollege(context, context.adminScope.collegeId);
    return college.id;
  }
  const membership = context.membership;
  const permission = kind === "ATTENDANCE" ? "academics.read" : "placements.read";
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, permission, {
        organizationId: membership.organizationId,
        collegeId: membership.collegeId,
      })) {
    throw new AuthorizationError(permission);
  }
  requirePermission(context, permission, {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  return membership.collegeId;
}

const zero = {
  markedSessions: 0,
  recordedRows: 0,
  absent: 0,
  late: 0,
  excused: 0,
  medical: 0,
  learners: 0,
  evidenceProfiles: 0,
  verifiedProfiles: 0,
  preferenceProfiles: 0,
};

export async function listCollegeDepartmentInsights(
  context: RequestContext,
  kind: DepartmentInsightsKind,
  raw: unknown,
) {
  const query = collegeDepartmentInsightsQuerySchema.parse(raw);
  const collegeId = await requireCollegeDepartmentInsightAccess(context, kind);
  const db = getDb();
  const condition = and(
    eq(departments.collegeId, collegeId),
    query.q ? ilike(departments.name, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%") : undefined,
  );
  const [totals, baseRows] = await Promise.all([
    db.select({ total: count() }).from(departments).where(condition),
    db.select({ id: departments.id, name: departments.name, archivedAt: departments.archivedAt })
      .from(departments)
      .where(condition)
      .orderBy(asc(departments.name), asc(departments.id))
      .limit(COLLEGE_DEPARTMENT_INSIGHTS_PAGE_SIZE)
      .offset((query.page - 1) * COLLEGE_DEPARTMENT_INSIGHTS_PAGE_SIZE),
  ]);
  const ids = baseRows.map((item) => item.id);
  const metrics = new Map<string, typeof zero>();
  if (ids.length > 0 && kind === "ATTENDANCE") {
    // Marked session count is distinct by event; explicit status rows are
    // separate evidence. PRESENT may be implicit in legacy attendance flows.
    const sessions = await db.select({
      departmentId: programs.departmentId,
      markedSessions: sql<number>`count(distinct ${attendanceSessions.scheduleEventId})`.mapWith(Number),
    }).from(attendanceSessions)
      .innerJoin(sectionScheduleEvents, and(
        eq(sectionScheduleEvents.id, attendanceSessions.scheduleEventId),
        eq(sectionScheduleEvents.status, "SCHEDULED"),
      ))
      .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, collegeId),
      ))
      .where(and(
        inArray(programs.departmentId, ids),
        eq(attendanceSessions.status, "MARKED"),
      ))
      .groupBy(programs.departmentId);
    for (const item of sessions) {
      metrics.set(item.departmentId, { ...zero, markedSessions: item.markedSessions });
    }
    const records = await db.select({
      departmentId: programs.departmentId,
      total: count(),
      absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'ABSENT')`.mapWith(Number),
      late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'LATE')`.mapWith(Number),
      excused: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'EXCUSED')`.mapWith(Number),
      medical: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'MEDICAL')`.mapWith(Number),
    }).from(attendanceRecords)
      .innerJoin(attendanceSessions, and(
        eq(attendanceSessions.scheduleEventId, attendanceRecords.scheduleEventId),
        eq(attendanceSessions.status, "MARKED"),
      ))
      .innerJoin(sectionScheduleEvents, and(
        eq(sectionScheduleEvents.id, attendanceRecords.scheduleEventId),
        eq(sectionScheduleEvents.status, "SCHEDULED"),
      ))
      .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, collegeId),
      ))
      .innerJoin(collegeMemberships, and(
        eq(collegeMemberships.id, attendanceRecords.membershipId),
        eq(collegeMemberships.collegeId, collegeId),
      ))
      .where(inArray(programs.departmentId, ids))
      .groupBy(programs.departmentId);
    for (const item of records) {
      metrics.set(item.departmentId, {
        ...(metrics.get(item.departmentId) ?? zero),
        recordedRows: item.total,
        absent: item.absent,
        late: item.late,
        excused: item.excused,
        medical: item.medical,
      });
    }
  }
  if (ids.length > 0 && kind === "PLACEMENT_READINESS") {
    // Count active learner enrollment and persisted profile evidence only.
    // Do NOT interpret missing values or verifiedAt as job eligibility.
    const rows = await db.select({
      departmentId: programs.departmentId,
      learners: sql<number>`count(distinct ${learnerProgramEnrollments.membershipId})`.mapWith(Number),
      evidenceProfiles: sql<number>`count(distinct ${placementCandidateAcademicEvidence.membershipId})`.mapWith(Number),
      verifiedProfiles: sql<number>`count(distinct case when ${placementCandidateAcademicEvidence.verifiedAt} is not null then ${placementCandidateAcademicEvidence.membershipId} end)`.mapWith(Number),
      preferenceProfiles: sql<number>`count(distinct ${placementCandidatePreferences.membershipId})`.mapWith(Number),
    }).from(learnerProgramEnrollments)
      .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, collegeId),
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
      .leftJoin(placementCandidateAcademicEvidence, eq(
        placementCandidateAcademicEvidence.membershipId,
        learnerProgramEnrollments.membershipId,
      ))
      .leftJoin(placementCandidatePreferences, eq(
        placementCandidatePreferences.membershipId,
        learnerProgramEnrollments.membershipId,
      ))
      .where(and(
        inArray(programs.departmentId, ids),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      ))
      .groupBy(programs.departmentId);
    for (const item of rows) {
      metrics.set(item.departmentId, {
        ...zero,
        learners: item.learners,
        evidenceProfiles: item.evidenceProfiles,
        verifiedProfiles: item.verifiedProfiles,
        preferenceProfiles: item.preferenceProfiles,
      });
    }
  }
  const total = totals[0]?.total ?? 0;
  return {
    kind,
    query,
    items: baseRows.map((item) => ({ ...item, ...(metrics.get(item.id) ?? zero) })),
    total,
    totalPages: departmentInsightsPageCount(total),
  };
}
