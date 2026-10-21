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

/** SUSPEND keeps the first suspendedAt even when reason changes; identical
 * retries return null and must not emit a second lifecycle audit event. */
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

/** Hard-delete is exceptional: ending a membership preserves shared user identity and history. */
export type MembershipDeletionAssessment = {
  isLearnerMembership: boolean;
  otherActiveMembershipCount: number;
  dependentRecordCount: number;
  retentionHold: boolean;
  requestedPermanentErasure: boolean;
};
export function membershipDeletionDecision(value: MembershipDeletionAssessment) {
  if (!value.requestedPermanentErasure) {
    return { action: "END" as const, reason: "Preserve account history across workspaces" };
  }
  if (!value.isLearnerMembership || value.retentionHold ||
      value.dependentRecordCount > 0 || value.otherActiveMembershipCount > 0) {
    return { action: "END" as const, reason: "Dependent records or another active membership require retention" };
  }
  return { action: "REVIEW_FOR_ERASURE" as const,
    reason: "Verify legal retention, private object deletion and audit before executing" };
}

export function membershipLifecycleActionResult(
  before: MembershipLifecycleState,input:MembershipLifecycleInput,now:Date,
): {changed:boolean;message:string;patch:MembershipLifecyclePatch|null} {
  const patch=getMembershipLifecyclePatch(before,input,now);
  return {changed:patch!==null,patch,message:patch===null
    ? "No change — this membership is already in the requested state."
    : input.action==="SUSPEND" ? "Membership suspended."
    : input.action==="REACTIVATE" ? "Membership reactivated." : "Membership ended."};
}
