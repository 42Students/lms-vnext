import "server-only";
import {and,eq,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents,collegeMemberships,colleges,membershipRoles,moduleAccessRules,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getSuperAdminLearnerAccessTrace} from "./admin-trace-service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {studentRuleWriteInput,studentRuleMatches,isStudentRuleNoop,hasPersistedAncestorLock} from "./admin-student-rule-model";

export class StudentRuleConflict extends Error {
 constructor(public readonly code:string){super(code);this.name="StudentRuleConflict";}
}
/** Legacy fallback copy plus actionable optimistic/ancestor conflict hints. */
export function studentRuleWriteErrorMessage(error:unknown):string{
 if(error instanceof StudentRuleConflict){
  if(error.code==="STALE_RULE")return "This rule changed in another tab. Refresh and try again.";
  if(error.code==="ANCESTOR_LOCKED")return "This module is locked at a higher level.";
 }
 return "Could not save — please retry";
}
/** The schema deliberately forbids nullable enabled rows. An imported
 * enabled=null + locked=true orphan cannot be silently represented as a
 * disabled rule: retain it for migration review, then clear via INHERIT.
 * Clearing an actual membership lock removes the override so a parent may
 * determine access, matching the effective old enabled=null/locked=false.
 */
export function legacyOrphanLearnerLockDisposition(input:{enabled:boolean|null;locked:boolean}){
 return input.enabled===null&&input.locked?
  {safeToImport:false,action:"REVIEW_BEFORE_CLEAR" as const}:
  {safeToImport:input.enabled!==null,action:"INHERIT" as const};
}
/** Explicit audited lock-clear uses the INHERIT transition with the latest
 * optimistic snapshot, rather than mutating a stale lock blindly. */
export async function clearSuperAdminStudentLock(
 context:RequestContext,collegeId:string,membershipId:string,
 module:"projects"|"electives",expected:{enabled:boolean;locked:boolean},
){
 return writeSuperAdminStudentRule(context,collegeId,membershipId,{
  action:"INHERIT",module,expected,
 });
}
export async function writeSuperAdminStudentRule(context:RequestContext,collegeInput:string,memberInput:string,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const collegeId=z.uuid().parse(collegeInput);
 const membershipId=z.uuid().parse(memberInput);
 const input=studentRuleWriteInput.parse(raw);
 const traced=await getSuperAdminLearnerAccessTrace(context,collegeId,{membershipId});
 if(!traced?.selected)return null;
 const selectedLearner=traced.selected;
 const moduleTrace=selectedLearner.modules.find(item=>item.module===input.module);
 if(input.action==="SET" && moduleTrace?.winnerLocked && moduleTrace.winnerLevel!=="MEMBERSHIP")
   throw new StudentRuleConflict("ANCESTOR_LOCKED");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,
   status:colleges.status}).from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")return null;
  requirePermission(context,"college.manage",{collegeId,organizationId:college.organizationId});
  // Never trust an earlier traced permission snapshot after a Super Admin is
  // disabled or removed from the system-role table. Persisted actor SHARE
  // locks are retained through both the no-op check and the eventual write.
  await assertPersistedPlatformPermission(tx,context,"college.manage",{
   collegeId,organizationId:college.organizationId,
  });
  // Serialize competing member-rule mutations through this single persisted row.
  await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
    .where(and(eq(collegeMemberships.id,membershipId),eq(collegeMemberships.collegeId,collegeId))).for("update");
  const [member]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId}).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(collegeMemberships.id,membershipId),eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
    .limit(1);
  if(!member)return null;
  const [role]=await tx.select({id:membershipRoles.membershipId}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,member.id),eq(membershipRoles.role,"LEARNER"))).limit(1);
  if(!role)return null;
  if(input.action==="SET"){
   // Re-evaluate persisted ancestor locks under row locks as close to the write as possible.
   // Existing ancestor rows cannot be concurrently updated while this transaction commits.
   const ancestorScopes=selectedLearner.chain.filter(scope=>scope.scopeType!=="MEMBERSHIP");
   const parentRules=ancestorScopes.length===0?[]:await tx.select({locked:moduleAccessRules.locked})
    .from(moduleAccessRules).where(and(eq(moduleAccessRules.module,input.module),
     or(...ancestorScopes.map(scope=>and(eq(moduleAccessRules.scopeType,scope.scopeType),
       scope.scopeId===null?isNull(moduleAccessRules.scopeId):eq(moduleAccessRules.scopeId,scope.scopeId)))))
    ).for("share");
   if(hasPersistedAncestorLock(parentRules))throw new StudentRuleConflict("ANCESTOR_LOCKED");
  }
  const predicate=and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
    eq(moduleAccessRules.scopeId,member.id),eq(moduleAccessRules.module,input.module));
  const [previous]=await tx.select({id:moduleAccessRules.id,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked}).from(moduleAccessRules).where(predicate).limit(1);
  if(!studentRuleMatches(input.expected,previous?{enabled:previous.enabled,locked:previous.locked}:null))
    throw new StudentRuleConflict("STALE_RULE");
  if(isStudentRuleNoop(previous?{enabled:previous.enabled,locked:previous.locked}:null,input))
    return {module:input.module,enabled:previous?.enabled??null,locked:previous?.locked??false,unchanged:true};
  if(input.action==="INHERIT"){
   if(previous)await tx.delete(moduleAccessRules).where(eq(moduleAccessRules.id,previous.id));
  }else if(previous){
   await tx.update(moduleAccessRules).set({enabled:input.enabled,locked:input.locked,updatedByUserId:context.user.id,updatedAt:new Date()}).where(eq(moduleAccessRules.id,previous.id));
  }else{
   await tx.insert(moduleAccessRules).values({scopeType:"MEMBERSHIP",scopeId:member.id,module:input.module,
    enabled:input.enabled,locked:input.locked,updatedByUserId:context.user.id});
  }
  if(!previous && input.action==="INHERIT")return {module:input.module,enabled:null,locked:false};
  await tx.insert(activityEvents).values({
   collegeId,organizationId:college.organizationId,actorUserId:context.user.id,module:"PLATFORM",
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,importance:"HIGH",
   subjectType:"MEMBERSHIP",subjectId:member.id,
   summary:"Super Admin updated a learner module override",
   metadata:{module:input.module,before:previous?{enabled:previous.enabled,locked:previous.locked}:null,
    after:input.action==="INHERIT"?null:{enabled:input.enabled,locked:input.locked}},
  });
  return {module:input.module,enabled:input.action==="INHERIT"?null:input.enabled,locked:input.action==="INHERIT"?false:input.locked,unchanged:false};
 });
}
