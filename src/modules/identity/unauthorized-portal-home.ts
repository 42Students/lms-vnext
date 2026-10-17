import {hasActiveRecruiter,hasMembershipRole,isSuperAdmin,type RequestContext} from "./context";
/** PUB-auth-public-29: never silently drop a user at a generic dashboard when
 * they simply navigated into another role's portal. No untrusted returnTo.
 */
export function deniedPortalHome(context:RequestContext):string{
 if(isSuperAdmin(context))return "/admin/tenants?access=denied";
 if(hasActiveRecruiter(context))return "/hr/home?access=denied";
 if(hasMembershipRole(context,"TPO"))return "/tpo/home?access=denied";
 if(hasMembershipRole(context,"COLLEGE_ADMIN"))return "/college?access=denied";
 if(hasMembershipRole(context,"FACULTY"))return "/teacher/courses?access=denied";
 if(hasMembershipRole(context,"MENTOR"))return "/mentor/projects?access=denied";
 if(hasMembershipRole(context,"LEARNER"))return "/learn/courses?access=denied";
 return "/dashboard?access=denied";
}
export const PORTAL_PERMISSION_DENIED="You don't have permission to perform this action.";
