import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { platformSettingOverrides } from "@/db/schema/platform-setting-overrides";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PLACEMENT_POLICY_FIELDS, platformPlacementPolicyInput, placementPolicyValidate } from "./platform-placement-policy-model";

function requirePlatformAdministrator(context:RequestContext) {
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
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
  const raw=override===undefined?null:Number(override.value);
  return {...field,value:raw!==null&&Number.isFinite(raw)?raw:field.defaultValue,
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
  const [existing]=await tx.select().from(platformSettingOverrides).where(identity(input.key)).for("update").limit(1);
  if((existing?.version??0)!==input.expectedVersion)throw new PlatformPlacementPolicyConflict();
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
  return {key:input.key,overridden:input.value!==null};
 });
}
