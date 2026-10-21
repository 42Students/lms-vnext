import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, lmsGroupMembers, lmsGroups,
  membershipRoles, projectInstances, projectMembers, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectTeamAuditInput } from "./mentor-team-audit-model";
import { notifyProjectMemberships } from "./project-notification-service";

/** Repair stale project learner rows from the authoritative class-team group.
 * This does not edit the group, its active membership, or the mentor roster.
 */
export async function reconcileProjectTeamRoster(
  context: RequestContext, projectId: string,
): Promise<{ changed: number }> {
  const scope = await requireProjectManageAccess(context, projectId);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({
      id: projectInstances.id, teamGroupId: projectInstances.teamGroupId,
      status: projectInstances.status, updatedAt: projectInstances.updatedAt,
    }).from(projectInstances).where(and(
      eq(projectInstances.id, scope.project.id),
      eq(projectInstances.collegeId, scope.collegeId),
    )).for("update").limit(1);
    if (!project?.teamGroupId || project.status === "ARCHIVED") {
      throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
    }
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
    const [team] = await tx.select({ id: lmsGroups.id }).from(lmsGroups)
      .where(and(eq(lmsGroups.id, project.teamGroupId),
        eq(lmsGroups.collegeId, scope.collegeId),
        eq(lmsGroups.status, "ACTIVE"), isNull(lmsGroups.deletedAt)))
      .for("update").limit(1);
    if (!team) throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");

    const teamMembers = await tx.select({
      membershipId: lmsGroupMembers.membershipId,
      collegeId: collegeMemberships.collegeId,
      membershipStatus: collegeMemberships.status,
      userStatus: users.platformStatus,
    }).from(lmsGroupMembers)
      .innerJoin(collegeMemberships, eq(collegeMemberships.id, lmsGroupMembers.membershipId))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER")))
      .where(and(eq(lmsGroupMembers.groupId, team.id),
        eq(lmsGroupMembers.memberType, "LEARNER"),
        eq(lmsGroupMembers.state, "ACTIVE")))
      .for("share");
    if (teamMembers.some(member =>
      member.collegeId !== scope.collegeId ||
      member.membershipStatus !== "ACTIVE" || member.userStatus !== "ACTIVE")) {
      throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
    }

    const desired = new Set(teamMembers.map(row => row.membershipId));
    const existing = await tx.select().from(projectMembers)
      .where(and(eq(projectMembers.projectId, project.id),
        isNull(projectMembers.endedAt))).for("update");
    const currentLearners = existing.filter(row => row.role === "LEARNER");
    const existingIds = new Set(currentLearners.map(row => row.membershipId));
    const toRemove = currentLearners.filter(row => !desired.has(row.membershipId));
    const toAdd = [...desired].filter(id => !existingIds.has(id));
    if (toAdd.some(id => existing.some(row => row.membershipId === id))) {
      throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
    }
    if (!toRemove.length && !toAdd.length) return { changed: 0 };

    const now = new Date(Math.max(Date.now(), project.updatedAt.getTime() + 1));
    for (const member of toRemove) {
      const [ended] = await tx.update(projectMembers).set({
        endedAt: now, isPrimary: false, updatedAt: now,
      }).where(and(eq(projectMembers.id, member.id),
        isNull(projectMembers.endedAt))).returning();
      if (!ended) throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
      const event = await recordActivityEventInTransaction(tx, context,
        projectTeamAuditInput("ENDED", {
          projectId: project.id, collegeId: scope.collegeId,
          organizationId: scope.organizationId,
        }, ended, randomUUID()));
      await notifyProjectMemberships(tx, event.id, {
        projectId: project.id, collegeId: scope.collegeId,
        membershipIds: [ended.membershipId], title: "Removed from project",
        body: "Your membership in " + scope.project.title + " has ended.",
        actionHref: "/learn/projects/" + project.id,
      });
    }
    for (const membershipId of toAdd) {
      const [added] = await tx.insert(projectMembers).values({
        projectId: project.id, membershipId, role: "LEARNER", roleKind: "LEARNER",
        canMutate: true, isPrimary: false, createdByUserId: context.user.id,
      }).returning();
      if (!added) throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
      const event = await recordActivityEventInTransaction(tx, context,
        projectTeamAuditInput("ADDED", {
          projectId: project.id, collegeId: scope.collegeId,
          organizationId: scope.organizationId,
        }, added, randomUUID()));
      await notifyProjectMemberships(tx, event.id, {
        projectId: project.id, collegeId: scope.collegeId,
        membershipIds: [membershipId], title: "Added to project",
        body: "You have been added to " + scope.project.title + ".",
        actionHref: "/learn/projects/" + project.id,
      });
    }
    await tx.update(projectInstances).set({ updatedAt: now })
      .where(eq(projectInstances.id, project.id));
    return { changed: toRemove.length + toAdd.length };
  });
}
