import "server-only";
import {and,asc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {users,systemRoles,collegeMemberships,membershipRoles,colleges,organizations} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {assertAnotherActiveCollegeAdmin} from "./last-college-admin-guard";

import { zUuid } from "@/lib/schema-primitives";
export const superAdminPlatformAccountCommandSchema=z.strictObject({
 status:z.enum(["ACTIVE","DISABLED"]),
 reason:z.string().trim().min(4).max(1000),
 confirmed:z.literal(true),
});
/** OD-23: reversible block is platform-wide, never a membership suspension. */
export async function changePlatformAccountStatus(context:RequestContext,rawUserId:unknown,rawInput:unknown){
 const userId=zUuid.parse(rawUserId);
 const input=superAdminPlatformAccountCommandSchema.parse(rawInput);
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("system-role.manage");
 requirePermission(context,"system-role.manage");
 if(context.user.id===userId)throw new AuthorizationError("system-role.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"system-role.manage");
  const [target]=await tx.select({id:users.id,status:users.platformStatus,name:users.displayName})
   .from(users).where(eq(users.id,userId)).for("update").limit(1);
  if(!target)throw new AuthorizationError("system-role.manage");
  const [privileged]=await tx.select({id:systemRoles.id}).from(systemRoles)
   .where(eq(systemRoles.userId,userId)).limit(1);
  if(privileged)throw new AuthorizationError("system-role.manage");
  if(target.status===input.status)return {userId,status:target.status,changed:false};
  if(input.status==="DISABLED"){
   // Blocking a platform identity also removes every one of their active
   // College Admin memberships from the live roster. Prevent a global block
   // from bypassing the last-admin guard used by membership role/lifecycle.
   // Acquire shared per-college advisory locks in sorted order to avoid
   // deadlock when different users administer overlapping sets of colleges.
   const adminMemberships=await tx.select({
    id:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
   }).from(collegeMemberships)
    .innerJoin(membershipRoles,and(
     eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,"COLLEGE_ADMIN"),
    ))
    .innerJoin(colleges,and(
     eq(colleges.id,collegeMemberships.collegeId),
     eq(colleges.status,"ACTIVE"),
    ))
    .innerJoin(organizations,and(
     eq(organizations.id,colleges.organizationId),
     eq(organizations.status,"ACTIVE"),
    ))
    .where(and(
     eq(collegeMemberships.userId,userId),
     eq(collegeMemberships.status,"ACTIVE"),
    ))
    .orderBy(asc(collegeMemberships.collegeId));
   for(const membership of adminMemberships){
    await assertAnotherActiveCollegeAdmin(tx,membership.collegeId,membership.id);
   }
  }
  const now=new Date();
  await tx.update(users).set({platformStatus:input.status,updatedAt:now}).where(eq(users.id,userId));
  if(input.status==="DISABLED"){
   await tx.execute(sql`UPDATE identity_device_sessions
    SET revoked_at=now(),revoked_by_user_id=${context.user.id}::uuid,
        revocation_reason='SUPER_ADMIN_PLATFORM_BLOCK'
    WHERE user_id=${userId}::uuid AND revoked_at IS NULL`);
  }
  await recordActivityEventInTransaction(tx,context,{
    eventType:input.status==="DISABLED"?ACTIVITY_EVENT_TYPES.PLATFORM_USER_BLOCKED:ACTIVITY_EVENT_TYPES.PLATFORM_USER_REACTIVATED,
    organizationId:null,collegeId:null,subjectType:"user",subjectId:userId,
    subjectLabel:target.name,
    summary:input.status==="DISABLED"?"Super Admin blocked a platform account":"Super Admin reactivated a platform account",
    metadata:{reason:input.reason,previousStatus:target.status,nextStatus:input.status},
  });
  return {userId,status:input.status,changed:true};
 });
}
