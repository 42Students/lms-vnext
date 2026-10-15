import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, projectMembers, users } from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import {
  mentorTeamCoverageQuerySchema,
  selectMentorTeamCoverage,
  summarizeActiveProjectTeam,
  type MentorTeamCoverageRow,
} from "./mentor-team-coverage-model";

/**
 * Only currently assigned Mentor projects are eligible. The active team
 * counts are real registered project_members joined to active same-college
 * memberships/users; no old end-dated membership contributes to coverage.
 */
export async function getMentorTeamCoverage(
  context: RequestContext, rawQuery: unknown,
) {
  const query = mentorTeamCoverageQuerySchema.parse(rawQuery);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"MENTOR") ||
      !can(context,"projects.read",{
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const access = await resolveOptionalModuleAccess(context);
  const empty = (enabled: boolean) => ({
    enabled,query,projectCount:0,
    summary:{zeroLearnerProjects:0,withoutPrimaryMentor:0},
    ...selectMentorTeamCoverage([],query),
  });
  if (!access.projects.enabled) return empty(false);

  const assigned = (await listMyProjectInstances(context))
    .filter(row => row.memberRole === "MENTOR" &&
      row.project.status !== "ARCHIVED");
  if (!assigned.length) return empty(true);
  const projectIds = assigned.map(row => row.project.id);
  const members = await getDb().select({
    projectId: projectMembers.projectId,
    role: projectMembers.role,
    isPrimary: projectMembers.isPrimary,
  }).from(projectMembers)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
    ))
    .where(and(
      inArray(projectMembers.projectId,projectIds),
      isNull(projectMembers.endedAt),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    ));

  const grouped = new Map<string,{role:string;isPrimary:boolean}[]>();
  for (const row of members) {
    const bucket = grouped.get(row.projectId) ?? [];
    bucket.push({role:row.role,isPrimary:row.isPrimary});
    grouped.set(row.projectId,bucket);
  }
  const rows: MentorTeamCoverageRow[] = assigned.map(row => ({
    projectId: row.project.id,
    title: row.project.title,
    status: row.project.status,
    isPrimaryMentor: row.isPrimaryMentor,
    ...summarizeActiveProjectTeam(grouped.get(row.project.id) ?? []),
  }));
  return {
    enabled:true,query,projectCount:rows.length,
    summary:{
      zeroLearnerProjects:rows.filter(row=>row.learners===0).length,
      withoutPrimaryMentor:rows.filter(row=>!row.hasPrimaryMentor).length,
    },
    ...selectMentorTeamCoverage(rows,query),
  };
}
