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

/** Preserve legacy Programs URLs using the same role checks as Departments. */
export function legacyProgramDestination(
  context: RequestContext,
  account: "COLLEGE_ADMIN" | "SUPER_ADMIN",
) {
  const departmentTarget = legacyDepartmentDestination(context, account);
  if (departmentTarget === "/college/departments") return "/college/programs";
  if (departmentTarget === "/admin/departments") return "/admin/programs";
  return "/dashboard";
}

/**
 * Preserve only filters that the canonical Super Admin directory actually owns.
 * Legacy bookmarks are not allowed to change a college or organization scope.
 * A denied caller always lands on the unfiltered Dashboard.
 */
export function legacyAdminBookmarkHref(
  destination: string,
  raw: Record<string, string | string[] | undefined>,
): string {
  if (destination === "/dashboard") return destination;
  const next = new URLSearchParams();
  if (destination === "/admin/programs") {
    const page = raw["page"];
    const pageSize = raw["pageSize"];
    const q = raw["q"];
    if (typeof page === "string" && /^[1-9][0-9]{0,3}$/.test(page)) next.set("page", page);
    if (typeof pageSize === "string" && /^[1-9][0-9]{0,2}$/.test(pageSize) &&
        Number(pageSize) <= 100) next.set("pageSize", pageSize);
    if (typeof q === "string" && q.trim() && q.length <= 100) next.set("q", q.trim());
  } else if (destination === "/admin/departments") {
    const type = raw["type"];
    if (typeof type === "string" && /^[a-z-]{1,40}$/i.test(type)) next.set("type", type);
  }
  const query = next.toString();
  return destination + (query ? "?" + query : "");
}
