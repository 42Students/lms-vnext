import type {
  MembershipRole,
  MembershipStatus,
} from "@/modules/identity/constants";
import { PeopleServiceError } from "./errors";
import type { MembershipLifecycleInput } from "./validation";

export type MembershipLifecycleState = {
  status: MembershipStatus;
  suspendedAt: Date | null;
  suspensionReason: string | null;
};

export type MembershipLifecyclePatch = Partial<MembershipLifecycleState>;

export function removeMembershipRoleFromSet(
  roles: readonly MembershipRole[],
  role: MembershipRole,
): MembershipRole[] {
  if (!roles.includes(role)) {
    return [...roles];
  }

  if (roles.length <= 1) {
    throw new PeopleServiceError("LAST_MEMBERSHIP_ROLE");
  }

  return roles.filter((current) => current !== role);
}

export function getMembershipLifecyclePatch(
  state: MembershipLifecycleState,
  input: MembershipLifecycleInput,
  now: Date,
): MembershipLifecyclePatch | null {
  switch (input.action) {
    case "SUSPEND":
      if (state.status === "ENDED") {
        throw new PeopleServiceError("MEMBERSHIP_ENDED");
      }

      if (
        state.status === "SUSPENDED" &&
        state.suspendedAt &&
        state.suspensionReason === input.reason
      ) {
        return null;
      }

      return {
        status: "SUSPENDED",
        suspendedAt: state.suspendedAt ?? now,
        suspensionReason: input.reason,
      };

    case "REACTIVATE":
      if (state.status === "ENDED") {
        throw new PeopleServiceError("MEMBERSHIP_ENDED");
      }

      if (
        state.status === "ACTIVE" &&
        !state.suspendedAt &&
        !state.suspensionReason
      ) {
        return null;
      }

      return {
        status: "ACTIVE",
        suspendedAt: null,
        suspensionReason: null,
      };

    case "END":
      if (
        state.status === "ENDED" &&
        !state.suspendedAt &&
        !state.suspensionReason
      ) {
        return null;
      }

      return {
        status: "ENDED",
        suspendedAt: null,
        suspensionReason: null,
      };
  }
}
