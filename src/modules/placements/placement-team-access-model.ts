import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import { ROLE } from "@/modules/identity/roles";
/** Placement cell includes active college administrators and TPOs. The service
 * must additionally call requirePlacementManageScope + persisted permission;
 * a role label alone never authorizes writes or cross-college reads. */
export function hasPlacementTeamMembership(context:RequestContext){
 return context.user.platformStatus==="ACTIVE"&&context.membership?.status==="ACTIVE"&&
  (hasMembershipRole(context,ROLE.TPO)||hasMembershipRole(context,ROLE.COLLEGE_ADMIN));
}
