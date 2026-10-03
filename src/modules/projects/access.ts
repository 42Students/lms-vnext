import {
  and,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectInstances,
  projectMembers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import type { ProjectMemberRole } from "./constants";
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
) {
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

  return scope;
}

export async function requireProjectReadAccess(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await loadProjectScope(projectIdInput);

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
    !membership ||
    membership.status !== "ACTIVE" ||
    membership.collegeId !== scope.collegeId
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
    })
    .from(projectMembers)
    .where(
      and(
        eq(
          projectMembers.projectId,
          scope.project.id,
        ),
        eq(
          projectMembers.membershipId,
          membership.id,
        ),
        isNull(projectMembers.endedAt),
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

  return {
    ...scope,
    member,
    access: member.role,
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
