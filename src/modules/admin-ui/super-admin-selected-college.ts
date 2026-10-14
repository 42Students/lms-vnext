import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission, type PlatformPermission } from "@/modules/permissions/policy";
export function requireSuperAdminSelectedCollege(context:RequestContext,permission:PlatformPermission) {
 const selected=context.adminScope;
 if(!isSuperAdmin(context)||!selected?.collegeId)throw new AuthorizationError(permission);
 requirePermission(context,permission,{collegeId:selected.collegeId,organizationId:selected.organizationId});
 return {collegeId:selected.collegeId,organizationId:selected.organizationId};
}
