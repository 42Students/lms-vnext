import { type MembershipRole } from "@/modules/identity/constants";

/** College Faculty onboarding cannot accidentally assign Learner/TPO/Admin roles. */
export function onboardingRoleSelection(
  forcedRole?: MembershipRole, selected: readonly MembershipRole[] = ["LEARNER"],
): MembershipRole[] {
  return forcedRole ? [forcedRole] : [...new Set(selected)];
}
