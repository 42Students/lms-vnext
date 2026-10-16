import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission, type PlatformPermission } from "@/modules/permissions/policy";

export type ActingCollegeScope = {
  collegeId: string;
  organizationId: string;
};

/**
 * Tenant selection is only an authorization input, not a trustworthy mapping
 * of college to organization. Super Admin mutations must use the persisted
 * active college/organization pair resolved on the server.
 */
export function requireActingCollege(
  context: RequestContext,
  permission: PlatformPermission,
  selectedCollege?: ActingCollegeScope | null,
): ActingCollegeScope {
  if (isSuperAdmin(context)) {
    if (!context.adminScope?.collegeId ||
      !selectedCollege ||
      selectedCollege.collegeId !== context.adminScope.collegeId ||
      (context.adminScope.organizationId !== null &&
        context.adminScope.organizationId !== undefined &&
        context.adminScope.organizationId !== selectedCollege.organizationId)) {
      throw new AuthorizationError(permission);
    }
    requirePermission(context, permission, selectedCollege);
    return selectedCollege;
  }

  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    throw new AuthorizationError(permission);
  }
  const scope = { collegeId: member.collegeId, organizationId: member.organizationId };
  requirePermission(context, permission, scope);
  return scope;
}
