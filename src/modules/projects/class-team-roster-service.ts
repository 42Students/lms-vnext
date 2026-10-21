import { and, asc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, collegeMemberships, departments, learnerProfiles, learnerProgramEnrollments, membershipRoles, programs, sectionEnrollments, sections, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadProjectCollegeScope } from "./scope";
import { getProjectAdminCollegeId } from "./admin-college-scope";
import { ProjectsServiceError } from "./errors";
import { previewVersion } from "./class-team-preview-token";
import { z } from "zod";

const uuid = z.string().uuid();

export function classRosterRevision(classId: string, members: readonly { membershipId: string; rollNumber: string }[]) {
  return previewVersion([{ name: classId, membershipIds: [...members].map(m => m.membershipId + ":" + m.rollNumber) }]);
}

/** Both roles are checked against persisted authority, never client-supplied role flags. */
export async function requireTeamCreationAuthority(context: RequestContext, collegeId: string) {
  const college = await loadProjectCollegeScope(uuid.parse(collegeId));
  // This is the College Admin workspace flow. Even a platform Super Admin
  // must explicitly act in the selected college; an organization-only or
  // unscoped session must not create another tenant's projects from a forged
  // collegeId in the request body.
  if (getProjectAdminCollegeId(context) !== college.id) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  requirePermission(context, "projects.manage", { organizationId: college.organizationId, collegeId: college.id });
  if (!isSuperAdmin(context)) {
    const membership = context.membership;
    if (!membership || membership.collegeId !== college.id || membership.status !== "ACTIVE") {
      throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
    }
    const [persisted] = await getDb().select({ id: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(eq(membershipRoles.membershipId, collegeMemberships.id), eq(membershipRoles.role, "COLLEGE_ADMIN")))
      .where(and(eq(collegeMemberships.id, membership.id), eq(collegeMemberships.userId, context.user.id), eq(collegeMemberships.collegeId, college.id), eq(collegeMemberships.status, "ACTIVE"), eq(users.platformStatus, "ACTIVE")))
      .limit(1);
    if (!persisted) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  return college;
}

export async function listProjectTeamClasses(
  context: RequestContext, collegeId: string, options:{q?:string;limit?:number}={},
) {
  const college = await requireTeamCreationAuthority(context, collegeId);
  const query=options.q?.trim().slice(0,120)??"";
  const pattern="%"+query.replace(/[\\%_]/g,"\\  const college = await requireTeamCreationAuthority(context, collegeId);
  return getDb().select({ id: sections.id, name: sections.name, code: sections.code })")+"%";
  const limit=Math.min(500,Math.max(1,options.limit??500));
  return getDb().select({ id: sections.id, name: sections.name, code: sections.code })
    .from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, college.id), eq(sections.status, "ACTIVE"),
      query?or(ilike(sections.name,pattern),ilike(sections.code,pattern)):undefined))
    .orderBy(asc(sections.name), asc(sections.id)).limit(limit);
}

export async function loadClassTeamRoster(context: RequestContext, collegeId: string, classId: string) {
  const college = await requireTeamCreationAuthority(context, collegeId);
  const sectionId = uuid.parse(classId);
  const [section] = await getDb().select({ id: sections.id, name: sections.name })
    .from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(sections.id, sectionId), eq(departments.collegeId, college.id), eq(sections.status, "ACTIVE")))
    .limit(1);
  if (!section) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const rows = await getDb().select({
    membershipId: collegeMemberships.id,
    rollNumber: learnerProfiles.rollNumber,
    registrationNumber: learnerProfiles.registrationNumber,
    displayName: users.displayName,
  }).from(sectionEnrollments)
    .innerJoin(learnerProgramEnrollments, eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(eq(membershipRoles.membershipId, collegeMemberships.id), eq(membershipRoles.role, "LEARNER")))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .where(and(eq(sectionEnrollments.sectionId, section.id), eq(sectionEnrollments.status, "ACTIVE"),
      eq(learnerProgramEnrollments.status, "ACTIVE"), eq(collegeMemberships.collegeId, college.id),
      eq(collegeMemberships.status, "ACTIVE"), eq(users.platformStatus, "ACTIVE")))
    .orderBy(asc(collegeMemberships.id)).limit(2001);
  if (!rows.length || rows.length > 2000) throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_UNSUPPORTED");
  const members = rows.map(row => ({
    membershipId: row.membershipId, displayName: row.displayName,
    rollNumber: (row.rollNumber || row.registrationNumber || row.membershipId).slice(0, 80),
  })).sort((a,b) => a.rollNumber.localeCompare(b.rollNumber, undefined, {numeric: true}) || a.membershipId.localeCompare(b.membershipId));
  if (new Set(members.map(member => member.membershipId)).size !== members.length) throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_DUPLICATE");
  return { collegeId: college.id, classId: section.id, className: section.name, revision: classRosterRevision(section.id, members), members };
}
