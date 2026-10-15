import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,moduleAccessRules} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {StudentRuleConflict} from "./admin-student-rule-write";
import {collegeRuleWriteSchema,collegeRuleSame,collegeRuleNoChange} from "./admin-college-rule-model";

export async function writeSuperAdminCollegeRule(context:RequestContext,rawCollege:string,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const collegeId=z.uuid().parse(rawCollege),input=collegeRuleWriteSchema.parse(raw);
 if(input.action==="INHERIT")throw new StudentRuleConflict("INHERIT_NOT_AVAILABLE");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")return null;
  requirePermission(context,"college.manage",{collegeId:college.id,organizationId:college.organizationId});
  const where=and(eq(moduleAccessRules.scopeType,"COLLEGE"),eq(moduleAccessRules.scopeId,college.id),eq(moduleAccessRules.module,input.module));
  const [existing]=await tx.select({id:moduleAccessRules.id,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
   .from(moduleAccessRules).where(where).limit(1);
  const before=existing?{enabled:existing.enabled,locked:existing.locked}:null;
  if(!collegeRuleSame(input.expected,before))throw new StudentRuleConflict("STALE_RULE");
  if(collegeRuleNoChange(before,input))return {module:input.module,enabled:existing?.enabled??null,locked:existing?.locked??false,unchanged:true};
  if(existing)await tx.update(moduleAccessRules).set({enabled:input.enabled,locked:input.locked,updatedAt:new Date(),updatedByUserId:context.user.id}).where(eq(moduleAccessRules.id,existing.id));
  else await tx.insert(moduleAccessRules).values({scopeType:"COLLEGE",scopeId:college.id,module:input.module,enabled:input.enabled,locked:input.locked,updatedByUserId:context.user.id});
  await tx.insert(activityEvents).values({
   collegeId:college.id,organizationId:college.organizationId,actorUserId:context.user.id,module:"PLATFORM",
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_MODULE_RULE_CHANGED,importance:"HIGH",
   subjectType:"COLLEGE",subjectId:college.id,
   summary:"Super Admin changed a college module rule",
   metadata:{module:input.module,before,after:{enabled:input.enabled,locked:input.locked}},
  });
  return {module:input.module,enabled:input.enabled,locked:input.locked,unchanged:false};
 });
}
