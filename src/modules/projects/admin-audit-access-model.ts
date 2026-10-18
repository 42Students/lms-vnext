import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/** Platform-wide template activity has no collegeId. It is visible only to an
 * active Super Admin who has deliberately cleared both admin scope filters.
 * College Admins and scope-bound Super Admin sessions remain college-limited. */
export function mayReadGlobalProjectAudit(
  context: RequestContext | null | undefined,
): boolean {
  if (!context || !isSuperAdmin(context)) return false;
  if (context.adminScope?.collegeId || context.adminScope?.organizationId) return false;
  return can(context, "activity.read");
}
