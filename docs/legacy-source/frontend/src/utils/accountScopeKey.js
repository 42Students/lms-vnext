/**
 * React subtree identity, NOT an authorization decision. Remount project/placement
 * data views when a different account, role or tenant is selected in this tab.
 * Back-end authorization remains mandatory for every request.
 */
export function accountScopeKey(user) {
  if (!user || user.id == null || !user.userType) return "anonymous";
  return JSON.stringify([
    user.userType,
    user.id,
    user.organizationId ?? user.orgId ?? null,
    user.collegeId ?? null,
    user.facultyType ?? null,
    user.currentMembershipKey ?? user.membershipKey ?? null,
  ]);
}
