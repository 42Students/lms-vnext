import {
  and,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  projectInstances,
  projectMembers,
  users,
} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import type { ProjectMemberRole } from "./constants";
import {mayMutateProjectWithRole,type ProjectMemberRoleKind} from "./member-role-kind-model";
import { ProjectsServiceError } from "./errors";
import { loadProjectCollegeScope } from "./scope";
import { projectInstanceIdSchema } from "./validation";

export async function loadProjectScope(
  projectIdInput: string,
) {
  const projectId =
    projectInstanceIdSchema.parse(projectIdInput);
  const [project] = await getDb()
    .select()
    .from(projectInstances)
    .where(eq(projectInstances.id, projectId))
    .limit(1);

  if (!project) {
    throw new ProjectsServiceError(
      "PROJECT_NOT_FOUND",
    );
  }

  const college =
    await loadProjectCollegeScope(project.collegeId);

  return {
    project,
    organizationId: college.organizationId,
    collegeId: college.id,
  };
}

export async function requireProjectManageAccess(
  context: RequestContext,
  projectIdInput: string,
  options: { includeDeleted?: boolean } = {},
) {
  // Projects IDs and their existence are private: an unprivileged TPO,
  // recruiter or learner must not distinguish a real foreign ID from a guess.
  if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope =
    await loadProjectScope(projectIdInput);

  if (
    !can(context, "projects.manage", {
      organizationId: scope.organizationId,
      collegeId: scope.collegeId,
    })
  ) {
    throw new ProjectsServiceError(
      "PROJECT_ACCESS_DENIED",
    );
  }

  if (scope.project.deletedAt && !options.includeDeleted) {
    throw new ProjectsServiceError("PROJECT_NOT_FOUND");
  }
  return scope;
}

export async function requireProjectReadAccess(
  context: RequestContext,
  projectIdInput: string,
) {
  // Project membership roles are only LEARNER / MENTOR. A TPO-only session
  // never needs to load the object first, which avoids a cross-tenant ID
  // existence oracle (PROJECT_NOT_FOUND versus PROJECT_ACCESS_DENIED).
  if(!isSuperAdmin(context)&&
    !hasMembershipRole(context,"COLLEGE_ADMIN")&&
    !hasMembershipRole(context,"MENTOR")&&
    !hasMembershipRole(context,"LEARNER"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  // A revoked Mentor/Learner must not learn whether a private project ID
  // exists. Preflight principal status before performing the object lookup.
  if (!isSuperAdmin(context) && !hasMembershipRole(context,"COLLEGE_ADMIN") &&
      (context.user.platformStatus !== "ACTIVE" ||
       context.membership?.status !== "ACTIVE"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope =
    await loadProjectScope(projectIdInput);

  if (scope.project.deletedAt && !can(context, "projects.manage", {
    organizationId: scope.organizationId, collegeId: scope.collegeId,
  })) throw new ProjectsServiceError("PROJECT_NOT_FOUND");

  if (
    can(context, "projects.manage", {
      organizationId: scope.organizationId,
      collegeId: scope.collegeId,
    })
  ) {
    return {
      ...scope,
      member: null,
      access: "ADMIN" as const,
    };
  }

  const membership = context.membership;
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.collegeId !== scope.collegeId ||
    membership.organizationId !== scope.organizationId
  ) {
    throw new ProjectsServiceError(
      "PROJECT_ACCESS_DENIED",
    );
  }

  const [member] = await getDb()
    .select({
      id: projectMembers.id,
      role: projectMembers.role,
      isPrimary: projectMembers.isPrimary,
      roleKind: projectMembers.roleKind,
      canMutate: projectMembers.canMutate,
    })
    .from(projectMembers)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
    ))
    .where(
      and(
        eq(projectMembers.projectId,scope.project.id),
        eq(projectMembers.membershipId,membership.id),
        isNull(projectMembers.endedAt),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.userId,context.user.id),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"),
      ),
    )
    .limit(1);

  if (
    !member ||
    !membership.roles.includes(
      member.role as ProjectMemberRole,
    )
  ) {
    throw new ProjectsServiceError(
      "PROJECT_ACCESS_DENIED",
    );
  }

  // LEARNER-projects-24/25: hiding the sidebar is not an authorization gate.
  // Check the effective learner Projects flag on direct URL/API reads as well.
  if (member.role === "LEARNER" &&
      !(await resolveOptionalModuleAccess(context)).projects.enabled) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }

  return {
    ...scope,
    member,
    access: member.role === "LEARNER" && member.roleKind === "LEARNER" && member.canMutate
      ? "LEARNER" as const
      : mayMutateProjectWithRole(member.roleKind as ProjectMemberRoleKind,member.canMutate) && member.role === "MENTOR"
        ? "MENTOR" as const
        : "OBSERVER" as const,
  };
}

export async function requireProjectLifecycleAccess(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  if (
    scope.access !== "ADMIN" &&
    scope.access !== "MENTOR"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_LIFECYCLE_ACCESS_DENIED",
    );
  }

  return scope;
}

/** Shared mutation gate for the legacy Admin and Mentor project workspaces. */
export async function requireProjectLifecycleMutationAccess(context: RequestContext, projectIdInput: string) {
  // Recruiter grants, TPO roles and learner membership never authorize
  // project lifecycle writes. Reject them before looking up module settings
  // or a project ID, avoiding an unnecessary tenant/configuration read.
  if (!isSuperAdmin(context) &&
      !hasMembershipRole(context,"COLLEGE_ADMIN") &&
      !hasMembershipRole(context,"MENTOR")) {
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
  // Deny disabled modules before any project ID existence/tenant lookup.
  // Callers retain their role and tenant checks through the lifecycle guard.
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled) {
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
  return requireProjectLifecycleAccess(context, projectIdInput);
}

/**
 * Presentation hint for Super Admin project pages. A selected acting college
 * is needed for a workspace-specific view; this never grants access and must
 * not replace requireProjectReadAccess / requireProjectManageAccess.
 */
export function projectWorkspaceCollegeSwitcherGuidance(
 context: RequestContext,
): { title: string; instruction: string } | null {
 if (!isSuperAdmin(context) || context.adminScope?.collegeId) return null;
 return {
  title: "No college selected",
  instruction: "Choose a college from the header switcher.",
 };
}
