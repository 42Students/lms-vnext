import {
  hasActiveMembership,
  hasActiveRecruiter,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

export type PlatformPermission =
  | "identity.self.manage"
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
  | "placements.tpo.team.manage"
  | "placements.recruiter.read"
  | "placements.recruiter.round.manage"
  | "placements.recruiter.slot.manage"
  | "placements.recruiter.outside.record"
  | "placements.recruiter.result.stage"
  | "placements.recruiter.note"
  | "activity.read"
  | "project-template.read"
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
  /** User/learner target resolved from a server-owned scoped row, never request JSON. */
  learnerMembershipId?: string | null;
  /** For a concrete delivery, service MUST prove enrollment before reading. */
  courseDeliveryId?: string | null;
  courseDeliveryAudienceAuthorized?: boolean;
  /** Verified membership+college team grant resolved server side. */
  tpoTeamAdministrator?: boolean;
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
    // Explicit organization and college scope must agree when both are present.
    // A forged cross-organization resource cannot be authorized by UUID alone.
    return resource.collegeId === selected.collegeId &&
      (!selected.organizationId || !resource.organizationId ||
        resource.organizationId === selected.organizationId);
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
      context.membership.collegeId === resource.collegeId &&
      // Both scope dimensions must agree when the target includes an organization.
      // A matching college UUID cannot authorize a mismatched organization.
      (!resource.organizationId ||
        context.membership?.organizationId === resource.organizationId),
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
    context.recruiter?.userId !== context.user.id ||
    !resource.collegeId?.trim() ||
    !resource.placementCompanyRelationshipId?.trim()
  ) {
    return false;
  }

  return Boolean(
    context.recruiter?.grants.some(
      (grant) =>
        grant.collegeId === resource.collegeId &&
        (!resource.organizationId ||
          grant.organizationId === resource.organizationId) &&
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

  if (permission === "identity.self.manage") {
    return true;
  }

  if (permission === "admin-scope.select") {
    return isSuperAdmin(context);
  }

  if (
    permission === "placements.recruiter.read" ||
    permission === "placements.recruiter.round.manage" ||
    permission === "placements.recruiter.slot.manage" ||
    permission === "placements.recruiter.outside.record" ||
    permission === "placements.recruiter.result.stage" ||
    permission === "placements.recruiter.note"
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

  // Global template catalogue is readable in any admin scope.
  // This grants no capability to publish, archive, edit, duplicate or assign.
  if (permission === "project-template.read") {
    return isSuperAdmin(context);
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

  // A LEARNER may never use a broad college read capability to inspect
  // a different learner. A service must pass the actual target membership.
  if (hasMembershipRole(context, "LEARNER") &&
      resource.learnerMembershipId &&
      resource.learnerMembershipId !== context.membership?.id) {
    return false;
  }

  // A delivery-specific course read must include an enrollment/targeting
  // decision from the authorized service, not just a matching college.
  if (permission === "courses.read" &&
      hasMembershipRole(context, "LEARNER") &&
      resource.courseDeliveryId &&
      resource.courseDeliveryAudienceAuthorized !== true) {
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

    case "placements.tpo.team.manage":
      return (
        (hasMembershipRole(context, "TPO") ||
          hasMembershipRole(context, "COLLEGE_ADMIN") ||
          (hasMembershipRole(context, "FACULTY") &&
            resource.tpoTeamAdministrator === true)) &&
        isSameMembershipCollege(context, resource)
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
