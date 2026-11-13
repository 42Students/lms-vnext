import {hasActiveRecruiter,hasMembershipRole,isSuperAdmin,type RequestContext} from "./context";
import { ROLE } from "@/modules/identity/roles";
/** PUB-auth-public-29: never silently drop a user at a generic dashboard when
 * they simply navigated into another role's portal. No untrusted returnTo.
 */
export function deniedPortalHome(context:RequestContext):string{
 if(isSuperAdmin(context))return "/admin/tenants?access=denied";
 if(hasActiveRecruiter(context))return "/hr/home?access=denied";
 if(hasMembershipRole(context,ROLE.TPO))return "/tpo/home?access=denied";
 if(hasMembershipRole(context,ROLE.COLLEGE_ADMIN))return "/college?access=denied";
 if(hasMembershipRole(context,ROLE.FACULTY))return "/teacher/courses?access=denied";
 if(hasMembershipRole(context,ROLE.MENTOR))return "/mentor/projects?access=denied";
 if(hasMembershipRole(context,ROLE.LEARNER))return "/learn/courses?access=denied";
 return "/dashboard?access=denied";
}
export const PORTAL_PERMISSION_DENIED="You don't have permission to perform this action.";
