import type {MembershipRole} from "@/modules/identity/constants";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {PeopleServiceError} from "./errors";

export type MembershipGuardAction="ROLE_ADD"|"ROLE_REMOVE"|"SUSPEND"|"REACTIVATE"|"END";

/** COL-people-R02: legacy College Admins cannot mutate a protected
 * College Admin/TPO account. Super Admins retain separately scoped access.
 * The repository repeats this check after locking the membership and roles. */
export function assertMutableMembershipTarget(
 context:RequestContext,
 target:{userId:string;roles:readonly MembershipRole[]},
 action:MembershipGuardAction,
 role?:MembershipRole,
){
 if(isSuperAdmin(context))return;
 if(target.userId===context.user.id&&(
  action==="SUSPEND"||action==="END"||
  action==="ROLE_REMOVE"&&role==="COLLEGE_ADMIN"
 ))throw new PeopleServiceError("MEMBERSHIP_SELF_LOCKOUT");
 if(target.roles.includes("COLLEGE_ADMIN")||target.roles.includes("TPO"))
  throw new PeopleServiceError("MEMBERSHIP_PROTECTED");
}

/** Preserve typed error codes in the API but offer exact actor remediation to
 * the caller: protected College Admin/TPO membership edits are Super Admin-only.
 */
export function protectedMembershipErrorMessage(
 code:"MEMBERSHIP_PROTECTED"|"MEMBERSHIP_SELF_LOCKOUT",
):string {
 return code==="MEMBERSHIP_PROTECTED"
  ?"Only a super admin can manage ADMIN/TPO accounts"
  :"You cannot suspend, end or remove your own required administrator role.";
}
