import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";

/**
 * Resolve the college used by College Admin project pages.
 *
 * A Super Admin acting inside a college must use the
 * explicitly selected admin scope, never an unrelated
 * membership or an unscoped platform-wide fallback.
 *
 * This is a navigation-level authorization check.
 * Project services must independently enforce their
 * own permissions and persisted college ownership.
 */
export function getProjectAdminCollegeId(
  context: RequestContext,
): string | null {
  const superAdmin = isSuperAdmin(context);

  const collegeId = superAdmin
    ? context.adminScope?.collegeId ?? null
    : context.membership?.collegeId ?? null;

  if (!collegeId) {
    return null;
  }

  const organizationId = superAdmin
    ? context.adminScope?.organizationId ?? null
    : context.membership?.organizationId ?? null;

  if (
    !can(context, "projects.manage", {
      collegeId,
      organizationId,
    })
  ) {
    return null;
  }

  return collegeId;
}
