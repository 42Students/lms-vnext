import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,membershipRoles,moduleAccessRules,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getSuperAdminLearnerAccessTrace} from "./admin-trace-service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

export const studentRuleWriteInput=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("SET"),module:z.enum(["projects","electives"]),enabled:z.boolean(),locked:z.literal(false)}),
 z.strictObject({action:z.literal("INHERIT"),module:z.enum(["projects","electives"])}),
]);
export class StudentRuleConflict extends Error {
 constructor(public readonly code:string){super(code);this.name="StudentRuleConflict";}
}
export async function writeSuperAdminStudentRule(context:RequestContext,collegeInput:string,memberInput:string,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const collegeId=z.uuid().parse(collegeInput);
 const membershipId=z.uuid().parse(memberInput);
 const input=studentRuleWriteInput.parse(raw);
 const traced=await getSuperAdminLearnerAccessTrace(context,collegeId,{membershipId});
 if(!traced?.selected)return null;
 const moduleTrace=traced.selected.modules.find(item=>item.module===input.module);
 if(input.action==="SET" && moduleTrace?.winnerLocked && moduleTrace.winnerLevel!=="MEMBERSHIP")
   throw new StudentRuleConflict("ANCESTOR_LOCKED");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges).where(eq(colleges.id,collegeId)).limit(1);
  if(!college)return null;
  requirePermission(context,"college.manage",{collegeId,organizationId:college.organizationId});
  const [member]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId}).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(collegeMemberships.id,membershipId),eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
    .limit(1);
  if(!member)return null;
  const [role]=await tx.select({id:membershipRoles.membershipId}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,member.id),eq(membershipRoles.role,"LEARNER"))).limit(1);
  if(!role)return null;
  const predicate=and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
    eq(moduleAccessRules.scopeId,member.id),eq(moduleAccessRules.module,input.module));
  const [previous]=await tx.select({id:moduleAccessRules.id,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked}).from(moduleAccessRules).where(predicate).limit(1);
  if(input.action==="INHERIT"){
   if(previous)await tx.delete(moduleAccessRules).where(eq(moduleAccessRules.id,previous.id));
  }else if(previous){
   await tx.update(moduleAccessRules).set({enabled:input.enabled,locked:false,updatedByUserId:context.user.id,updatedAt:new Date()}).where(eq(moduleAccessRules.id,previous.id));
  }else{
   await tx.insert(moduleAccessRules).values({scopeType:"MEMBERSHIP",scopeId:member.id,module:input.module,
    enabled:input.enabled,locked:false,updatedByUserId:context.user.id});
  }
  if(!previous && input.action==="INHERIT")return {module:input.module,enabled:null,locked:false};
  await tx.insert(activityEvents).values({
   collegeId,organizationId:college.organizationId,actorUserId:context.user.id,module:"PLATFORM",
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,importance:"HIGH",
   subjectType:"MEMBERSHIP",subjectId:member.id,
   summary:"Super Admin updated a learner module override",
   metadata:{module:input.module,before:previous?{enabled:previous.enabled,locked:previous.locked}:null,
    after:input.action==="INHERIT"?null:{enabled:input.enabled,locked:false}},
  });
  return {module:input.module,enabled:input.action==="INHERIT"?null:input.enabled,locked:false};
 });
}
