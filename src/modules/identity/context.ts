import type {
  MembershipRole,
  MembershipStatus,
  SystemRole,
  UserPlatformStatus,
} from "./constants";

import { ROLE } from "@/modules/identity/roles";
export type AuthenticatedUser = {
  id: string;
  identityUid: string;
  platformStatus: UserPlatformStatus;
  systemRoles: readonly SystemRole[];
};

export type ActiveMembership = {
  id: string;
  collegeId: string;
  organizationId: string;
  status: MembershipStatus;
  roles: readonly MembershipRole[];
};

export type AdminScope = {
  organizationId: string | null;
  collegeId: string | null;
};

export type RecruiterGrant = {
  id: string;
  organizationId: string;
  collegeId: string;
  collegeName: string;
  companyRelationshipId: string;
};

export type RecruiterContext = {
  userId: string;
  companyId: string;
  companyName: string;
  title: string | null;
  status: "ACTIVE";
  grants: readonly RecruiterGrant[];
};

export type RequestContext = {
  user: AuthenticatedUser;
  membership: ActiveMembership | null;
  adminScope?: AdminScope | null;
  recruiter?: RecruiterContext | null;
};

export function isSuperAdmin(context: RequestContext | null | undefined) {
  return Boolean(
    context &&
      context.user.platformStatus === "ACTIVE" &&
      // Selecting a college membership is entering that membership workspace;
      // platform Super Admin must not override its selected role permissions.
      // Admin scope (with membership null) remains the platform admin path.
      context.membership === null &&
      context.user.systemRoles.includes(ROLE.SUPER_ADMIN),
  );
}

export function hasMembershipRole(
  context: RequestContext | null | undefined,
  role: MembershipRole,
) {
  return Boolean(
    context?.user.platformStatus === "ACTIVE" &&
      context.membership?.status === "ACTIVE" &&
      // A RequestContext represents exactly ONE selected membership role.
      // Never union College Admin/TPO powers with a Learner workspace if a
      // stale or incorrectly constructed context carries multiple roles.
      context.membership.roles.length === 1 &&
      context.membership.roles[0] === role,
  );
}

export function hasActiveMembership(
  context: RequestContext | null | undefined,
) {
  return Boolean(
    context &&
      context.user.platformStatus === "ACTIVE" &&
      context.membership?.status === "ACTIVE" &&
      context.membership.roles.length === 1,
  );
}


export function hasActiveRecruiter(
  context: RequestContext | null | undefined,
) {
  return Boolean(
    context &&
      context.user.platformStatus === "ACTIVE" &&
      context.recruiter?.status === "ACTIVE",
  );
}
