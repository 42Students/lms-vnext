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
import {
  collegeMemberships,
  membershipRoles,
  projectInstances,
  projectMeetings,
  projectMembers,
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
        ilike(users.displayName, `%${query.q}%`),
        ilike(users.email, `%${query.q}%`),
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
        ilike(users.displayName, `%${query.q}%`),
        ilike(users.email, `%${query.q}%`),
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
            isPrimary: true,
            roleLabel: normalizedRoleLabel,
            createdByUserId: context.user.id,
          });
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
    // Legacy also clears task assignees belonging to
    // the outgoing mentor. vNext project_tasks has no
    // assignee column yet, so that side effect remains
    // an explicit DB07 parity blocker.
    taskAssignmentClearingSupported: false,
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
      return tx.insert(projectMembers).values({
        projectId: scope.project.id,
        membershipId: input.membershipId,
        role: input.role,
        isPrimary: input.isPrimary,
        roleLabel: input.roleLabel ?? null,
        createdByUserId: context.user.id,
      }).returning();
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
    const [updated] = await getDb()
      .update(projectMembers)
      .set({
        ...(input.isPrimary !== undefined
          ? { isPrimary: input.isPrimary }
          : {}),
        ...(input.roleLabel !== undefined
          ? { roleLabel: input.roleLabel }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(projectMembers.id, member.id))
      .returning();

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
    const [project] = await tx.select({ teamGroupId: projectInstances.teamGroupId })
      .from(projectInstances).where(eq(projectInstances.id, scope.project.id)).for("update");
    if (member.role === "LEARNER" && project?.teamGroupId)
      throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
    const [fresh] = await tx.select().from(projectMembers)
      .where(and(eq(projectMembers.id, member.id), isNull(projectMembers.endedAt)))
      .for("update");
    if (!fresh) throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
    const now = new Date();
    const [ended] = await tx.update(projectMembers)
      .set({ endedAt: now, isPrimary: false, updatedAt: now })
      .where(eq(projectMembers.id, member.id)).returning();
    return ended!;
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
    .where(
      and(
        eq(
          projectMembers.projectId,
          scope.project.id,
        ),
        isNull(projectMembers.endedAt),
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
