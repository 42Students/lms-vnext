import {
  and,
  asc,
  eq,
  ilike,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  projectInstances,
  projectMembers,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import type { ProjectMemberRole } from "./constants";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectManageAccess,
  requireProjectReadAccess,
} from "./access";
import {
  addProjectMemberInputSchema,
  projectMemberCandidateQuerySchema,
  projectMemberIdSchema,
  updateProjectMemberInputSchema,
  type AddProjectMemberInput,
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

  if (!membership) {
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
        isNull(projectMembers.id),
        search,
      ),
    )
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(query.limit);
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
    !membership ||
    membership.status !== "ACTIVE"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_ACCESS_DENIED",
    );
  }

  return getDb()
    .select({
      memberId: projectMembers.id,
      memberRole: projectMembers.role,
      isPrimaryMentor: projectMembers.isPrimary,
      project: projectInstances,
    })
    .from(projectMembers)
    .innerJoin(
      projectInstances,
      eq(
        projectInstances.id,
        projectMembers.projectId,
      ),
    )
    .where(
      and(
        eq(
          projectMembers.membershipId,
          membership.id,
        ),
        isNull(projectMembers.endedAt),
        eq(
          projectInstances.collegeId,
          membership.collegeId,
        ),
      ),
    )
    .orderBy(asc(projectInstances.title));
}
