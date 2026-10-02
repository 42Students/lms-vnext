import {
  hasActiveMembership,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

export type PlatformPermission =
  | "admin-scope.select"
  | "organization.read"
  | "organization.manage"
  | "college.read"
  | "college.manage"
  | "department.read"
  | "department.manage"
  | "academics.read"
  | "academics.manage"
  | "people.manage"
  | "system-role.manage"
  | "membership.role.manage"
  | "membership.lifecycle.manage";

export type ResourceScope = {
  organizationId?: string | null;
  collegeId?: string | null;
};

function isInsideAdminScope(
  context: RequestContext,
  resource: ResourceScope,
) {
  const selected = context.adminScope;
  if (!selected) return true;

  if (selected.collegeId) {
    return resource.collegeId === selected.collegeId;
  }

  if (selected.organizationId) {
    return resource.organizationId === selected.organizationId;
  }

  return true;
}

function isSameMembershipCollege(
  context: RequestContext,
  resource: ResourceScope,
) {
  return Boolean(
    context.membership?.collegeId &&
      resource.collegeId &&
      context.membership.collegeId === resource.collegeId,
  );
}

function isSameMembershipOrganization(
  context: RequestContext,
  resource: ResourceScope,
) {
  return Boolean(
    context.membership?.organizationId &&
      resource.organizationId &&
      context.membership.organizationId === resource.organizationId,
  );
}

export function can(
  context: RequestContext | null | undefined,
  permission: PlatformPermission,
  resource: ResourceScope = {},
): boolean {
  if (!context || context.user.platformStatus !== "ACTIVE") {
    return false;
  }

  if (permission === "admin-scope.select") {
    return isSuperAdmin(context);
  }

  if (isSuperAdmin(context)) {
    return isInsideAdminScope(context, resource);
  }

  if (!hasActiveMembership(context)) {
    return false;
  }

  switch (permission) {
    case "organization.read":
      return (
        hasMembershipRole(context, "COLLEGE_ADMIN") &&
        isSameMembershipOrganization(context, resource)
      );

    case "organization.manage":
      return false;

    case "college.read":
    case "department.read":
    case "academics.read":
      return isSameMembershipCollege(context, resource);

    case "system-role.manage":
      return false;

    case "college.manage":
    case "department.manage":
    case "academics.manage":
    case "people.manage":
    case "membership.role.manage":
    case "membership.lifecycle.manage":
      return (
        hasMembershipRole(context, "COLLEGE_ADMIN") &&
        isSameMembershipCollege(context, resource)
      );
  }
}

export class AuthorizationError extends Error {
  constructor(permission: PlatformPermission) {
    super(`Missing permission: ${permission}`);
    this.name = "AuthorizationError";
  }
}

export function requirePermission(
  context: RequestContext | null | undefined,
  permission: PlatformPermission,
  resource: ResourceScope = {},
) {
  if (!can(context, permission, resource)) {
    throw new AuthorizationError(permission);
  }
}
