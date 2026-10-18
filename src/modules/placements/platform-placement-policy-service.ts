import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { platformSettingOverrides } from "@/db/schema/platform-setting-overrides";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import { PLACEMENT_POLICY_FIELDS, platformPlacementPolicyInput, placementPolicyValidate, storedPlacementPolicyValue } from "./platform-placement-policy-model";

function requirePlatformAdministrator(context:RequestContext) {
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
}
export class PlatformPlacementPolicyValidationError extends Error {
 constructor(){super("INTERVIEW_MIN_EXCEEDS_MAX");}
}
export class PlatformPlacementPolicyConflict extends Error {
 constructor(){super("POLICY_VERSION_CHANGED");}
}
function identity(key:string) {
 return and(eq(platformSettingOverrides.scopeType,"GLOBAL"),
  eq(platformSettingOverrides.scopeId,"GLOBAL"),eq(platformSettingOverrides.key,key));
}
export async function listPlatformPlacementPolicy(context:RequestContext) {
 requirePlatformAdministrator(context);
 const overrides=await getDb().select().from(platformSettingOverrides)
  .where(and(eq(platformSettingOverrides.scopeType,"GLOBAL"),
    eq(platformSettingOverrides.scopeId,"GLOBAL")));
 const values=new Map(overrides.map(row=>[row.key,row]));
 return PLACEMENT_POLICY_FIELDS.map(field=>{
  const override=values.get(field.key);
  const value=storedPlacementPolicyValue(field.key,override?.value);
  return {...field,value,
   isOverridden:override!==undefined,version:override?.version??0,updatedAt:override?.updatedAt.toISOString()??null};
 });
}
export async function setPlatformPlacementPolicy(context:RequestContext,raw:unknown) {
 requirePlatformAdministrator(context);
 const input=platformPlacementPolicyInput.parse(raw);
 if(input.value!==null&&!placementPolicyValidate(input.key,input.value))
  throw new Error("POLICY_VALUE_OUT_OF_RANGE");
 const db=getDb();
 return db.transaction(async tx=>{
  // Every policy key shares this transaction-scoped lock. Locking only the
  // edited row permits concurrent min/max updates to violate their invariant.
  await tx.execute(sql`select pg_advisory_xact_lock(42, 130038)`);
  // The RequestContext can be stale after user deactivation or role revocation.
  // Admin scope may legitimately be college-selected while this policy remains
  // global; admin-scope.select proves the current persisted SUPER_ADMIN role.
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [existing]=await tx.select().from(platformSettingOverrides).where(identity(input.key)).for("update").limit(1);
  if((existing?.version??0)!==input.expectedVersion)throw new PlatformPlacementPolicyConflict();
  if(input.key==="interview.durationMinMinutes"||input.key==="interview.durationMaxMinutes") {
   const otherKey=input.key==="interview.durationMinMinutes"?"interview.durationMaxMinutes":"interview.durationMinMinutes";
   const [other]=await tx.select({value:platformSettingOverrides.value}).from(platformSettingOverrides).where(identity(otherKey)).limit(1);
   const currentOther=storedPlacementPolicyValue(otherKey,other?.value);
   const ownDefault=PLACEMENT_POLICY_FIELDS.find(field=>field.key===input.key)!.defaultValue;
   const ownValue=input.value??ownDefault;
   const minimum=input.key==="interview.durationMinMinutes"?ownValue:currentOther;
   const maximum=input.key==="interview.durationMaxMinutes"?ownValue:currentOther;
   if(minimum>maximum)throw new PlatformPlacementPolicyValidationError();
  }
  if(input.value===null){
   if(existing)await tx.delete(platformSettingOverrides).where(identity(input.key));
  } else if(existing){
   await tx.update(platformSettingOverrides).set({
    value:String(input.value),version:existing.version+1,updatedAt:new Date(),
    updatedByUserId:context.user.id,
   }).where(identity(input.key));
  } else {
   await tx.insert(platformSettingOverrides).values({
    scopeType:"GLOBAL",scopeId:"GLOBAL",key:input.key,value:String(input.value),
    version:1,updatedByUserId:context.user.id,
   });
  }
  // Audit is part of the same transaction: a failed event insert rolls back
  // the policy mutation. No event is needed when resetting an absent override.
  if(input.value!==null||existing){
   const field=PLACEMENT_POLICY_FIELDS.find(item=>item.key===input.key)!;
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_PLATFORM_POLICY_UPDATED,
    subjectType:"platform_setting",subjectId:input.key,subjectLabel:field.label,
    summary:"Super Admin updated a global placement policy",
    metadata:{key:input.key,action:input.value===null?"RESET":"SET",
     previousVersion:existing?.version??0,
     nextVersion:input.value===null?0:(existing?.version??0)+1,
     previousValue:existing?.value??null,nextValue:input.value},
    groupKey:"placements:platform_policy:"+input.key,
   });
  }
  return {key:input.key,overridden:input.value!==null};
 });
}
