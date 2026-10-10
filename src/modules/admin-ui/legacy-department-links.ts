import {
  hasActiveMembership,
  hasMembershipRole,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";

/** Resolve legacy bookmarks to their active vNext account workspace. */
export function legacyDepartmentDestination(
  context: RequestContext,
  account: "COLLEGE_ADMIN" | "SUPER_ADMIN",
) {
  if (account === "SUPER_ADMIN") {
    return isSuperAdmin(context) ? "/admin/departments" : "/dashboard";
  }
  return hasActiveMembership(context) &&
    hasMembershipRole(context, "COLLEGE_ADMIN")
    ? "/college/departments"
    : "/dashboard";
}
