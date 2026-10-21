import "server-only";
import {and,eq,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents,colleges,moduleAccessRules} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {StudentRuleConflict} from "./admin-student-rule-write";
import {collegeRuleWriteSchema,collegeRuleSame,collegeRuleNoChange,hasCollegeAncestorLock} from "./admin-college-rule-model";

export async function writeSuperAdminCollegeRule(context:RequestContext,rawCollege:string,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 // Legacy PUT {module,enabled} lacked the vNext expected-state token.
 // Reject that ambiguous request instead of silently dropping enabled.
 // Compatibility clients must translate null -> INHERIT, booleans -> SET
 // and supply the last-read expected snapshot before sending the write.
 if(raw && typeof raw==="object" && !Array.isArray(raw) &&
   "enabled" in raw && !("action" in raw)){
   throw new StudentRuleConflict("EXPECTED_STATE_REQUIRED");
 }
 const collegeId=z.uuid().parse(rawCollege),input=collegeRuleWriteSchema.parse(raw);
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)return null;
  // Keep inactive (not deleted) colleges in history but block new grants.
  if(college.status!=="ACTIVE")throw new StudentRuleConflict("INACTIVE_COLLEGE");
  requirePermission(context,"college.manage",{collegeId:college.id,organizationId:college.organizationId});
  await assertPersistedPlatformPermission(tx,context,"college.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const where=and(eq(moduleAccessRules.scopeType,"COLLEGE"),eq(moduleAccessRules.scopeId,college.id),eq(moduleAccessRules.module,input.module));
  const [existing]=await tx.select({id:moduleAccessRules.id,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
   .from(moduleAccessRules).where(where).for("update").limit(1);
  const before=existing?{enabled:existing.enabled,locked:existing.locked}:null;
  if(!collegeRuleSame(input.expected,before))throw new StudentRuleConflict("STALE_RULE");
  if(collegeRuleNoChange(before,input))return {module:input.module,enabled:existing?.enabled??null,locked:existing?.locked??false,unchanged:true};
  // A college-local lock prevents any value change or removal until a
  // persisted Super Admin explicitly unlocks the *same* stored value first.
  // This is a two-step operation, never an implicit unlock+toggle.
  if(before?.locked && (input.action==="INHERIT" ||
    input.enabled!==before.enabled || input.locked===true)){
    throw new StudentRuleConflict("LOCAL_LOCKED");
  }
  if(input.action==="SET"){
   const ancestors=await tx.select({locked:moduleAccessRules.locked})
    .from(moduleAccessRules)
    .where(and(eq(moduleAccessRules.module,input.module),
     or(and(eq(moduleAccessRules.scopeType,"ORGANIZATION"),eq(moduleAccessRules.scopeId,college.organizationId)),
       and(eq(moduleAccessRules.scopeType,"GLOBAL"),isNull(moduleAccessRules.scopeId)))))
    .for("share");
   if(hasCollegeAncestorLock(ancestors))throw new StudentRuleConflict("ANCESTOR_LOCKED");
  }
  if(input.action==="INHERIT"){
   if(existing)await tx.delete(moduleAccessRules).where(eq(moduleAccessRules.id,existing.id));
  }else if(existing){
   await tx.update(moduleAccessRules).set({enabled:input.enabled,locked:input.locked,updatedAt:new Date(),updatedByUserId:context.user.id}).where(eq(moduleAccessRules.id,existing.id));
  }else{
   await tx.insert(moduleAccessRules).values({scopeType:"COLLEGE",scopeId:college.id,module:input.module,enabled:input.enabled,locked:input.locked,updatedByUserId:context.user.id});
  }
  await tx.insert(activityEvents).values({
   collegeId:college.id,organizationId:college.organizationId,actorUserId:context.user.id,module:"PLATFORM",
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_MODULE_RULE_CHANGED,importance:"HIGH",
   subjectType:"COLLEGE",subjectId:college.id,
   summary:"Super Admin changed a college module rule",
   metadata:{module:input.module,before,after:input.action==="INHERIT"?null:{enabled:input.enabled,locked:input.locked},
    legacyCategory:"COLLEGE_FEATURE_TOGGLE",legacySettingKey:"module."+input.module,
    legacyPreviousEnabled:before?.enabled??null,
    legacyNewEnabled:input.action==="INHERIT"?null:input.enabled,
    legacyPreviousLocked:before?.locked??false,
    legacyNewLocked:input.action==="INHERIT"?false:input.locked,
    inheritedLocked:false,actorPermission:"college.manage"},
  });
  return {module:input.module,enabled:input.action==="INHERIT"?null:input.enabled,locked:input.action==="INHERIT"?false:input.locked,unchanged:false};
 });
}
