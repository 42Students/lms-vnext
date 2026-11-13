import {mayMutateProjectWithRole,type ProjectMemberRoleKind} from "./member-role-kind-model";
import { ROLE } from "@/modules/identity/roles";
/** Read-only Mentor assignments can view meetings, but only a persisted
 * primary/co-mentor mutation grant may offer state-changing controls.
 * The mutation services independently recheck inside each transaction.
 */
export function mentorCalendarCanMutateMeeting(input:{
 memberRole:string;roleKind:string;canMutate:boolean;projectStatus:string;
}):boolean{
 return input.memberRole===ROLE.MENTOR&&input.projectStatus==="ACTIVE"&&
   mayMutateProjectWithRole(input.roleKind as ProjectMemberRoleKind,input.canMutate);
}
