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

/** Explicit safe replacement for old destructive account controls. A college
 * membership is not an independent identity: one person can belong to several
 * colleges and roles, and activity/learning/placement records are retained. */
export const MEMBERSHIP_ADMIN_ACTION_EXPLANATIONS = {
  end: "End access to this college without deleting the person's shared account or history.",
  delete: "Permanent account deletion is not available here. End membership access or request a reviewed erasure.",
  bulkUndo: "Undo imported memberships with an audited reversal. Existing learning, attendance and placement records are retained.",
  impersonate: "Sign in as a student or faculty member is not permitted. Use an audited, permission-scoped support view.",
  otpUnlock: "Reset only a verified account's OTP lockout through the authorized identity support action; never bypass verification.",
} as const;
export function membershipAdminLegacyAction(
  action: "DELETE_STUDENT" | "DELETE_FACULTY" | "UNDO_BULK_IMPORT" | "IMPERSONATE" | "CLEAR_OTP_LOCKOUT",
): { allowed: false; alternative: keyof typeof MEMBERSHIP_ADMIN_ACTION_EXPLANATIONS } {
  switch (action) {
    case "DELETE_STUDENT":
    case "DELETE_FACULTY": return {allowed:false,alternative:"delete"};
    case "UNDO_BULK_IMPORT": return {allowed:false,alternative:"bulkUndo"};
    case "IMPERSONATE": return {allowed:false,alternative:"impersonate"};
    case "CLEAR_OTP_LOCKOUT": return {allowed:false,alternative:"otpUnlock"};
  }
}
