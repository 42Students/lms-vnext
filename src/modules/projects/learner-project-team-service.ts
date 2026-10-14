import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, projectMembers, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import { summarizeLearnerProjectTeams } from "./learner-project-team-model";

const projectIdsSchema = z.array(z.string().uuid()).max(2000);

/** Bulk read, scoped to this live learner assignment; arbitrary IDs cannot broaden it. */
export async function listMyLearnerProjectTeams(
  context: RequestContext,
  rawProjectIds: unknown,
) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "LEARNER")) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const requested = projectIdsSchema.parse(rawProjectIds);
  const assigned = await listMyProjectInstances(context);
  const allowed = new Set(assigned.filter(row => row.memberRole === "LEARNER")
    .map(row => row.project.id));
  const projectIds = [...new Set(requested.filter(id => allowed.has(id)))];
  if (projectIds.length === 0) return [];

  const members = await getDb()
    .select({
      projectId: projectMembers.projectId,
      membershipId: projectMembers.membershipId,
      role: projectMembers.role,
      isPrimary: projectMembers.isPrimary,
      displayName: users.displayName,
    })
    .from(projectMembers)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
    ))
    .where(and(
      inArray(projectMembers.projectId, projectIds),
      eq(collegeMemberships.collegeId, context.membership!.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      isNull(projectMembers.endedAt),
    ));
  return summarizeLearnerProjectTeams(projectIds, members);
}
