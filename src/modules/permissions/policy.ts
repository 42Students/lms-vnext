import {
  hasActiveMembership,
  hasActiveRecruiter,
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
  | "courses.read"
  | "courses.manage"
  | "projects.read"
  | "projects.manage"
  | "placements.read"
  | "placements.manage"
  | "placements.recruiter.read"
  | "placements.recruiter.result.stage"
  | "activity.read"
  | "project-template.manage"
  | "project-template.assign"
  | "people.manage"
  | "profile.self.manage"
  | "profile-verification.review"
  | "system-role.manage"
  | "membership.role.manage"
  | "membership.lifecycle.manage";

export type ResourceScope = {
  organizationId?: string | null;
  collegeId?: string | null;
  placementCompanyRelationshipId?: string | null;
  /** Trusted server-side lookups, never values read from request JSON. */
  tpoVerificationEnabled?: boolean;
  tpoVerificationAdministrator?: boolean;
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

function hasRecruiterGrant(
  context: RequestContext,
  resource: ResourceScope,
) {
  if (
    !hasActiveRecruiter(context) ||
    !resource.collegeId ||
    !resource.placementCompanyRelationshipId
  ) {
    return false;
  }

  return Boolean(
    context.recruiter?.grants.some(
      (grant) =>
        grant.collegeId === resource.collegeId &&
        grant.companyRelationshipId ===
          resource.placementCompanyRelationshipId,
    ),
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

  if (
    permission === "placements.recruiter.read" ||
    permission === "placements.recruiter.result.stage"
  ) {
    return hasRecruiterGrant(context, resource);
  }

  // Self-profile writes are membership capabilities, never a global
  // SUPER_ADMIN bypass. A feature service must still assert the exact profile
  // role (LEARNER or FACULTY) before mutating role-specific persistence.
  if (permission === "profile.self.manage") {
    return (
      hasActiveMembership(context) &&
      (hasMembershipRole(context, "LEARNER") ||
        hasMembershipRole(context, "FACULTY")) &&
      isSameMembershipCollege(context, resource)
    );
  }

  if (
    permission === "system-role.manage" ||
    permission === "project-template.manage"
  ) {
    return (
      isSuperAdmin(context) &&
      !context.adminScope?.organizationId &&
      !context.adminScope?.collegeId
    );
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
    case "courses.read":
    case "projects.read":
      return isSameMembershipCollege(context, resource);

    case "placements.read":
      return (
        (hasMembershipRole(context, "LEARNER") ||
          hasMembershipRole(context, "TPO") ||
          hasMembershipRole(context, "COLLEGE_ADMIN")) &&
        isSameMembershipCollege(context, resource)
      );

    case "activity.read":
      return (
        hasMembershipRole(
          context,
          "COLLEGE_ADMIN",
        ) &&
        isSameMembershipCollege(
          context,
          resource,
        )
      );

    case "project-template.assign":
      return false;

    case "profile-verification.review":
      return isSameMembershipCollege(context, resource) && (
        hasMembershipRole(context, "COLLEGE_ADMIN") ||
        (hasMembershipRole(context, "TPO") &&
          resource.tpoVerificationAdministrator === true &&
          resource.tpoVerificationEnabled === true)
      );

    case "placements.manage":
      return (
        (hasMembershipRole(context, "TPO") ||
          hasMembershipRole(context, "COLLEGE_ADMIN")) &&
        isSameMembershipCollege(context, resource)
      );

    case "college.manage":
    case "department.manage":
    case "academics.manage":
    case "courses.manage":
    case "projects.manage":
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
