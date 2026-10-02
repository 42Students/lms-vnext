import type {
  MembershipRole,
  MembershipStatus,
  SystemRole,
  UserPlatformStatus,
} from "./constants";

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

export type RequestContext = {
  user: AuthenticatedUser;
  membership: ActiveMembership | null;
  adminScope?: AdminScope | null;
};

export function isSuperAdmin(context: RequestContext | null | undefined) {
  return Boolean(
    context &&
      context.user.platformStatus === "ACTIVE" &&
      context.user.systemRoles.includes("SUPER_ADMIN"),
  );
}

export function hasMembershipRole(
  context: RequestContext | null | undefined,
  role: MembershipRole,
) {
  return Boolean(
    context?.membership?.status === "ACTIVE" &&
      context.membership.roles.includes(role),
  );
}

export function hasActiveMembership(
  context: RequestContext | null | undefined,
) {
  return Boolean(
    context &&
      context.user.platformStatus === "ACTIVE" &&
      context.membership?.status === "ACTIVE",
  );
}
