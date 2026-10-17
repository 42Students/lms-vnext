import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { containsLikePattern } from "@/lib/sql-match";
import {randomUUID} from "node:crypto";
import {projectTeamAuditInput} from "./mentor-team-audit-model";
import { mayRemovePrimaryProjectMentor } from "./primary-mentor-policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { notifyActiveProjectMembers, notifyProjectMemberships } from "./project-notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  membershipRoles,
  projectInstances,
  projectMeetings,
  projectMembers,
  projectTasks,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import type { ProjectMemberRole } from "./constants";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectManageAccess,
  requireProjectReadAccess,
} from "./access";
import { loadProjectCollegeScope } from "./scope";
import {
  addProjectMemberInputSchema,
  bulkProjectMentorReassignmentInputSchema,
  projectMemberCandidateQuerySchema,
  projectMentorCandidateQuerySchema,
  projectMemberIdSchema,
  updateProjectMemberInputSchema,
  type AddProjectMemberInput,
  type BulkProjectMentorReassignmentInput,
  type UpdateProjectMemberInput,
} from "./validation";

function mapMemberConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "project_members_active_membership_uq":
      return new ProjectsServiceError(
        "PROJECT_MEMBER_CONFLICT",
      );
    case "project_members_active_primary_mentor_uq":
      return new ProjectsServiceError(
        "PROJECT_PRIMARY_MENTOR_CONFLICT",
      );
    default:
      return error;
  }
}

async function loadEligibleMembership(
  membershipId: string,
  collegeId: string,
  role: ProjectMemberRole,
) {
  const [membership] = await getDb()
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
      platformStatus: users.platformStatus,
      displayName: users.displayName,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, role),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!membership || membership.platformStatus !== "ACTIVE") {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_ROLE_REQUIRED",
    );
  }

  if (membership.collegeId !== collegeId) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_COLLEGE_MISMATCH",
    );
  }

  return membership;
}

async function loadActiveProjectMember(
  projectId: string,
  memberId: string,
) {
  const [member] = await getDb()
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.id, memberId),
        eq(projectMembers.projectId, projectId),
        isNull(projectMembers.endedAt),
      ),
    )
    .limit(1);

  if (!member) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_NOT_FOUND",
    );
  }

  return member;
}

export async function listProjectMemberCandidates(
  context: RequestContext,
  projectIdInput: string,
  rawQuery: unknown,
) {
  const scope = await requireProjectManageAccess(
    context,
    projectIdInput,
  );
  const query = projectMemberCandidateQuerySchema.parse(rawQuery);
  const search = query.q
    ? or(
        ilike(users.displayName, containsLikePattern(query.q)),
        ilike(users.email, containsLikePattern(query.q)),
      )
    : undefined;

  return getDb()
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, query.role),
      ),
    )
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.membershipId, collegeMemberships.id),
        eq(projectMembers.projectId, scope.project.id),
        isNull(projectMembers.endedAt),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.collegeId, scope.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        isNull(projectMembers.id),
        search,
      ),
    )
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(query.limit);
}

export async function listProjectMentorCandidates(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: unknown,
) {
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  const query =
    projectMentorCandidateQuerySchema.parse(
      rawQuery,
    );
  const search = query.q
    ? or(
        ilike(users.displayName, containsLikePattern(query.q)),
        ilike(users.email, containsLikePattern(query.q)),
      )
    : undefined;

  return getDb()
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "MENTOR"),
      ),
    )
    .where(
      and(
        eq(
          collegeMemberships.collegeId,
          college.id,
        ),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        search,
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(collegeMemberships.id),
    )
    .limit(query.limit);
}

export async function reassignProjectPrimaryMentor(
  context: RequestContext,
  projectIdInput: string,
  mentorMembershipId: string,
  roleLabel = "Project Mentor",
) {
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({
          id: projectInstances.id,
          collegeId: projectInstances.collegeId,
          status: projectInstances.status,
        })
        .from(projectInstances)
        .where(
          and(
            eq(
              projectInstances.id,
              scope.project.id,
            ),
            eq(
              projectInstances.collegeId,
              scope.collegeId,
            ),
          ),
        )
        .for("update")
        .limit(1);

      if (
        !project ||
        project.status === "ARCHIVED"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_INVALID_STATE",
        );
      }

      const [eligibleTarget] = await tx
        .select({
          membershipId: collegeMemberships.id,
          displayName: users.displayName,
        })
        .from(collegeMemberships)
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .innerJoin(
          membershipRoles,
          and(
            eq(
              membershipRoles.membershipId,
              collegeMemberships.id,
            ),
            eq(
              membershipRoles.role,
              "MENTOR",
            ),
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.id,
              mentorMembershipId,
            ),
            eq(
              collegeMemberships.collegeId,
              scope.collegeId,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(users.platformStatus, "ACTIVE"),
          ),
        )
        .for("share")
        .limit(1);

      if (!eligibleTarget) {
        throw new ProjectsServiceError(
          "PROJECT_MEMBER_ROLE_REQUIRED",
        );
      }

      const activeMembers = await tx
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(
              projectMembers.projectId,
              project.id,
            ),
            isNull(projectMembers.endedAt),
          ),
        )
        .for("update");

      const currentPrimary =
        activeMembers.find(
          (member) =>
            member.role === "MENTOR" &&
            member.isPrimary,
        ) ?? null;
      const targetMember =
        activeMembers.find(
          (member) =>
            member.membershipId ===
            mentorMembershipId,
        ) ?? null;

      if (
        targetMember &&
        targetMember.role !== "MENTOR"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_MEMBER_ROLE_REQUIRED",
        );
      }

      const normalizedRoleLabel =
        roleLabel.trim() || "Project Mentor";
      if (
        currentPrimary?.membershipId ===
          mentorMembershipId &&
        (currentPrimary.roleLabel?.trim() ||
          "Project Mentor") ===
          normalizedRoleLabel
      ) {
        return {
          projectId: project.id,
          reassigned: false,
          skipped: true,
          outgoingMembershipId:
            currentPrimary.membershipId,
          mentorMembershipId,
          mentorName:
            eligibleTarget.displayName,
        };
      }

      const now = new Date();
      if (
        currentPrimary &&
        currentPrimary.id !== targetMember?.id
      ) {
        await tx
          .update(projectMembers)
          .set({
            isPrimary: false,
            endedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMembers.id,
                currentPrimary.id,
              ),
              isNull(projectMembers.endedAt),
            ),
          );
      }

      if (targetMember) {
        await tx
          .update(projectMembers)
          .set({
            isPrimary: true,
            roleLabel: normalizedRoleLabel,
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMembers.id,
                targetMember.id,
              ),
              isNull(projectMembers.endedAt),
            ),
          );
      } else {
        await tx
          .insert(projectMembers)
          .values({
            projectId: project.id,
            membershipId:
              mentorMembershipId,
            role: "MENTOR",
            roleKind: "MENTOR",
            canMutate: true,
            isPrimary: true,
            roleLabel: normalizedRoleLabel,
            createdByUserId: context.user.id,
          });
      }

      if (currentPrimary && currentPrimary.membershipId !== mentorMembershipId) {
        // COL-people-23: ownership of the outgoing mentor's tasks must not
        // remain on a membership which is no longer in this workspace.
        await tx.update(projectTasks)
          .set({ assigneeMembershipId: null, updatedAt: now })
          .where(and(
            eq(projectTasks.projectId, project.id),
            eq(projectTasks.assigneeMembershipId, currentPrimary.membershipId),
          ));
      }

      if (
        currentPrimary &&
        currentPrimary.membershipId !==
          mentorMembershipId
      ) {
        await tx
          .update(projectMeetings)
          .set({
            status: "CANCELLED",
            cancellationNote:
              "Primary mentor reassigned",
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMeetings.projectId,
                project.id,
              ),
              eq(
                projectMeetings
                  .scheduledByMembershipId,
                currentPrimary.membershipId,
              ),
              inArray(
                projectMeetings.status,
                ["REQUESTED", "SCHEDULED"],
              ),
            ),
          );
      }

      await tx
        .update(projectInstances)
        .set({ updatedAt: now })
        .where(
          eq(
            projectInstances.id,
            project.id,
          ),
        );

      const reassignedEvent = await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_REASSIGNED,
          collegeId: project.collegeId,
          organizationId:
            scope.organizationId,
          subjectType:
            "project_instance",
          subjectId: project.id,
          subjectLabel:
            scope.project.title,
          summary:
            "Primary Project mentor reassigned",
          metadata: {
            projectId: project.id,
            outgoingMembershipId:
              currentPrimary?.membershipId ?? null,
            incomingMembershipId:
              mentorMembershipId,
          },
          groupKey:
            "projects:instance:" +
            project.id,
          dedupeKey:
            "projects:instance:" +
            project.id +
            ":mentor-reassigned:" +
            now.toISOString(),
        },
      );

      await notifyProjectMemberships(tx, reassignedEvent.id, {
        projectId: project.id, collegeId: scope.collegeId,
        membershipIds: [mentorMembershipId, ...(currentPrimary?.membershipId &&
          currentPrimary.membershipId !== mentorMembershipId ? [currentPrimary.membershipId] : [])],
        title: "Project mentor reassigned",
        body: "The mentor for " + scope.project.title + " has changed.",
        actionHref: "/mentor/projects/" + project.id,
      });
      await notifyActiveProjectMembers(tx, reassignedEvent.id, {
        projectId: project.id, collegeId: scope.collegeId, roles: ["LEARNER"],
        title: "Project mentor reassigned",
        body: "Your project " + scope.project.title + " has a new mentor.",
        actionHref: "/learn/projects/" + project.id,
      });
      return {
        projectId: project.id,
        reassigned: true,
        skipped: false,
        outgoingMembershipId:
          currentPrimary?.membershipId ?? null,
        mentorMembershipId,
        mentorName:
          eligibleTarget.displayName,
      };
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapMemberConstraint(error);
  }
}

export async function bulkReassignProjectMentor(
  context: RequestContext,
  rawInput: BulkProjectMentorReassignmentInput,
) {
  const input =
    bulkProjectMentorReassignmentInputSchema.parse(
      rawInput,
    );
  const college =
    await loadProjectCollegeScope(
      input.collegeId,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  let reassignedCount = 0;
  let skippedCount = 0;
  const failures: {
    projectId: string;
    code: string;
  }[] = [];

  for (const projectId of input.projectIds) {
    try {
      const [project] = await getDb()
        .select({
          collegeId: projectInstances.collegeId,
        })
        .from(projectInstances)
        .where(
          eq(projectInstances.id, projectId),
        )
        .limit(1);
      if (
        !project ||
        project.collegeId !== input.collegeId
      ) {
        throw new ProjectsServiceError(
          "PROJECT_ACCESS_DENIED",
        );
      }

      const result =
        await reassignProjectPrimaryMentor(
          context,
          projectId,
          input.mentorMembershipId,
          input.roleLabel,
        );

      if (result.skipped) {
        skippedCount += 1;
      } else {
        reassignedCount += 1;
      }
    } catch (error) {
      failures.push({
        projectId,
        code:
          error instanceof ProjectsServiceError
            ? error.code
            : "PROJECT_REASSIGNMENT_FAILED",
      });
    }
  }

  return {
    reassignedCount,
    skippedCount,
    failures,
    taskAssignmentClearingSupported: true,
  };
}

export async function addProjectMember(
  context: RequestContext,
  projectIdInput: string,
  rawInput: AddProjectMemberInput,
) {
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const input =
    addProjectMemberInputSchema.parse(rawInput);

  await loadEligibleMembership(
    input.membershipId,
    scope.collegeId,
    input.role,
  );

  try {
    const [member] = await getDb().transaction(async tx => {
      const [project] = await tx.select({ teamGroupId: projectInstances.teamGroupId })
        .from(projectInstances).where(eq(projectInstances.id, scope.project.id)).for("update");
      if (input.role === "LEARNER" && project?.teamGroupId)
        throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
      const [created]=await tx.insert(projectMembers).values({
        projectId: scope.project.id,
        membershipId: input.membershipId,
        role: input.role,
        roleKind: input.roleKind ?? (input.role === "MENTOR" ? "MENTOR" : "LEARNER"),
        canMutate: input.canMutate ?? !["OBSERVER","REVIEWER","QA"].includes(input.roleKind ?? ""),
        isPrimary: input.isPrimary,
        roleLabel: input.roleLabel ?? null,
        createdByUserId: context.user.id,
      }).returning();
      if(!created)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      const event = await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ADDED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },created));
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[created.membershipId],
        title:created.role==="MENTOR"?"New project assigned":"Added to project",
        body:"You have been added to "+scope.project.title+".",
        actionHref:(created.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id,
      });
      return [created];
    });
    return member;
  } catch (error) {
    throw mapMemberConstraint(error);
  }
}

export async function updateProjectMember(
  context: RequestContext,
  projectIdInput: string,
  memberIdInput: string,
  rawInput: UpdateProjectMemberInput,
) {
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const memberId =
    projectMemberIdSchema.parse(memberIdInput);
  const input =
    updateProjectMemberInputSchema.parse(rawInput);
  const member = await loadActiveProjectMember(
    scope.project.id,
    memberId,
  );

  if (
    input.isPrimary === true &&
    member.role !== "MENTOR"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_ROLE_REQUIRED",
    );
  }

  try {
    const [updated]=await getDb().transaction(async tx=>{
      const [project]=await tx.select({status:projectInstances.status})
        .from(projectInstances).where(eq(projectInstances.id,scope.project.id))
        .for("update").limit(1);
      if(!project)throw new ProjectsServiceError("PROJECT_NOT_FOUND");
      const [fresh]=await tx.select().from(projectMembers)
        .where(and(
          eq(projectMembers.id,member.id),eq(projectMembers.projectId,scope.project.id),
          isNull(projectMembers.endedAt),
        )).for("update").limit(1);
      if(!fresh)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      if(input.isPrimary===false && !mayRemovePrimaryProjectMentor(project.status,fresh.role,fresh.isPrimary))
        throw new ProjectsServiceError("PROJECT_INVALID_STATE");
      if(input.isPrimary===true&&fresh.role!=="MENTOR")
        throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      const roleKind=input.roleKind??fresh.roleKind;
      const canMutate=input.canMutate??fresh.canMutate;
      if((fresh.role==="LEARNER" && !["LEARNER","OBSERVER","REVIEWER","QA"].includes(roleKind))||
         (fresh.role==="MENTOR" && roleKind==="LEARNER")||
         (["OBSERVER","REVIEWER","QA"].includes(roleKind)&&canMutate)||
         (fresh.isPrimary && project.status==="ACTIVE" && (roleKind!=="MENTOR" || !canMutate))||
         (input.isPrimary===true && (roleKind!=="MENTOR" || !canMutate)))
        throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      const [changed]=await tx.update(projectMembers).set({
        ...(input.isPrimary!==undefined?{isPrimary:input.isPrimary}:{}),
        ...(input.roleLabel!==undefined?{roleLabel:input.roleLabel}:{}),
        ...(input.roleKind!==undefined?{roleKind:input.roleKind}:{}),
        ...(input.canMutate!==undefined?{canMutate:input.canMutate}:{}),
        updatedAt:new Date(),
      }).where(and(eq(projectMembers.id,fresh.id),
        eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
        .returning();
      if(!changed)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      const event=await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("UPDATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },changed,randomUUID()));
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[changed.membershipId],exceptUserId:context.user.id,
        title:"Project role updated",body:"Your project role or permissions have changed.",
        actionHref:(changed.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id+"?tab=team",
      });
      return [changed];
    });
    return updated;
  } catch (error) {
    throw mapMemberConstraint(error);
  }
}

export async function endProjectMember(
  context: RequestContext,
  projectIdInput: string,
  memberIdInput: string,
) {
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const memberId =
    projectMemberIdSchema.parse(memberIdInput);
  const member = await loadActiveProjectMember(
    scope.project.id,
    memberId,
  );

  return getDb().transaction(async tx => {
    const [project] = await tx.select({ teamGroupId: projectInstances.teamGroupId,status:projectInstances.status })
      .from(projectInstances).where(eq(projectInstances.id, scope.project.id)).for("update");
    if (member.role === "LEARNER" && project?.teamGroupId)
      throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
    const [fresh] = await tx.select().from(projectMembers)
      .where(and(eq(projectMembers.id, member.id), isNull(projectMembers.endedAt)))
      .for("update");
    if (!fresh) throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
    if (!project || !mayRemovePrimaryProjectMentor(project.status,fresh.role,fresh.isPrimary))
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    const now = new Date();
    const [ended] = await tx.update(projectMembers)
      .set({ endedAt: now, isPrimary: false, updatedAt: now })
      .where(and(eq(projectMembers.id, fresh.id),
        eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
      .returning();
    if(!ended)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
    const event = await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ENDED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },ended));
    await notifyProjectMemberships(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      membershipIds:[ended.membershipId],title:"Removed from project",
      body:"Your membership in "+scope.project.title+" has ended.",
      actionHref:(ended.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id,
    });
    return ended;
  });
}

export async function listProjectMembers(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  return getDb()
    .select({
      id: projectMembers.id,
      membershipId: projectMembers.membershipId,
      role: projectMembers.role,
      roleKind: projectMembers.roleKind,
      canMutate: projectMembers.canMutate,
      isPrimary: projectMembers.isPrimary,
      roleLabel: projectMembers.roleLabel,
      displayName: users.displayName,
      startedAt: projectMembers.startedAt,
    })
    .from(projectMembers)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        projectMembers.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
      ),
    )
    .where(
      and(
        eq(projectMembers.projectId,scope.project.id),
        isNull(projectMembers.endedAt),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"),
      ),
    )
    .orderBy(
      asc(projectMembers.role),
      asc(users.displayName),
    );
}

export async function listMyProjectInstances(
  context: RequestContext,
) {
  const membership = context.membership;
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !membership ||
    membership.status !== "ACTIVE"
  ) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // Never trust the request-context membership/college pair as-is: a forged
  // college must be a denial, not an empty (successful-looking) project list.
  const [persisted] = await getDb()
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .where(and(
      eq(collegeMemberships.id, membership.id),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .limit(1);
  if (!persisted) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // Do not trust an old project_members assignment as authorization after
  // revoking the user's LEARNER/MENTOR role or suspending their account.
  return getDb()
    .select({
      memberId: projectMembers.id,
      memberRole: projectMembers.role,
      isPrimaryMentor: projectMembers.isPrimary,
      project: projectInstances,
    })
    .from(projectMembers)
    .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
    ))
    .where(and(
      eq(projectMembers.membershipId,membership.id),
      isNull(projectMembers.endedAt),
      eq(projectInstances.collegeId,membership.collegeId),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .orderBy(asc(projectInstances.title));
}
