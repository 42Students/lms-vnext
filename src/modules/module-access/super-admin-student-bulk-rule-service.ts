import "server-only";
import {and,asc,eq,inArray,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,membershipRoles,moduleAccessRules,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {getSuperAdminLearnerAccessTrace} from "./admin-trace-service";
import {hasPersistedAncestorLock,isStudentRuleNoop,studentRuleMatches} from "./admin-student-rule-model";
import {StudentRuleConflict} from "./admin-student-rule-write";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

/**
 * A bounded atomic command. The 25-ID cap is deliberate until an indexed,
 * single-query 1000-learner preflight and a larger API payload are available.
 * Never simulate "all or nothing" with separate student transactions.
 * Placements intentionally excluded: membership overrides do not affect it.
 */
const inputSchema=z.strictObject({
 membershipIds:z.array(z.uuid()).min(1).max(25).refine(ids=>new Set(ids).size===ids.length),
 module:z.enum(["projects","electives"]),
 action:z.enum(["ENABLE","DISABLE","INHERIT"]),confirmed:z.literal(true),
});

class BulkRuleRejected extends Error {
 constructor(readonly membershipId:string,readonly code:"LEARNER_NOT_FOUND"|"MODULE_NOT_SUPPORTED"){
  super(code);this.name="BulkRuleRejected";
 }
}
function failureMessage(error:unknown):string{
 if(error instanceof AuthorizationError)return "Not allowed to edit this learner.";
 if(error instanceof StudentRuleConflict&&error.code==="STALE_RULE")
  return "The rule changed. Refresh and try again.";
 if(error instanceof StudentRuleConflict&&error.code==="ANCESTOR_LOCKED")
  return "A higher-level locked rule prevents this change.";
 if(error instanceof BulkRuleRejected&&error.code==="LEARNER_NOT_FOUND")
  return "Learner unavailable in this college.";
 if(error instanceof BulkRuleRejected&&error.code==="MODULE_NOT_SUPPORTED")
  return "This module cannot be edited for the selected learner.";
 return "Could not update the selected learners. No changes were saved.";
}

export async function updateSuperAdminStudentRulesInBulk(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const acting=await resolveActingCollege(context,"college.manage");
 const input=inputSchema.parse(raw);
 let activeId=input.membershipIds[0]!;
 try {
  // Preflight ALL learners before opening the write transaction. The values
  // are optimistic only; persisted rows and locks are verified again below.
  const prepared=[];
  for(const membershipId of [...input.membershipIds].sort()){
   activeId=membershipId;
   const trace=await getSuperAdminLearnerAccessTrace(context,acting.collegeId,{membershipId});
   if(!trace?.selected)throw new BulkRuleRejected(membershipId,"LEARNER_NOT_FOUND");
   const moduleTrace=trace.selected.modules.find(entry=>entry.module===input.module);
   if(!moduleTrace)throw new BulkRuleRejected(membershipId,"MODULE_NOT_SUPPORTED");
   const stored=moduleTrace.steps.find(step=>step.level==="MEMBERSHIP");
   const expected=stored?.source==="PERSISTED"&&stored.value!==null
    ?{enabled:stored.value,locked:stored.locked}:null;
   prepared.push({membershipId,chain:trace.selected.chain,expected});
  }

  // Every write, its immutable per-learner audit entry and the bulk summary
  // share ONE transaction. Any stale rule, lock, disable or DB failure rolls
  // back the entire command, including the summary; never report partial saves.
  const applied=await getDb().transaction(async tx=>{
   const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,
    status:colleges.status}).from(colleges).where(eq(colleges.id,acting.collegeId))
    .for("update").limit(1);
   if(!college||college.status!=="ACTIVE")throw new AuthorizationError("college.manage");
   requirePermission(context,"college.manage",{
    collegeId:college.id,organizationId:college.organizationId,
   });
   await assertPersistedPlatformPermission(tx,context,"college.manage",{
    collegeId:college.id,organizationId:college.organizationId,
   });

   // Lock memberships in stable order, matching single-learner writers.
   const rows=await tx.select({id:collegeMemberships.id,status:collegeMemberships.status,
    userStatus:users.platformStatus}).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(collegeMemberships.collegeId,college.id),
     inArray(collegeMemberships.id,prepared.map(item=>item.membershipId))))
    .orderBy(asc(collegeMemberships.id)).for("update");
   const validRows=new Set(rows.filter(row=>row.status==="ACTIVE"&&row.userStatus==="ACTIVE").map(row=>row.id));
   const learnerRoles=await tx.select({membershipId:membershipRoles.membershipId})
    .from(membershipRoles).where(and(inArray(membershipRoles.membershipId,
     prepared.map(item=>item.membershipId)),eq(membershipRoles.role,"LEARNER")))
    .for("share");
   const learners=new Set(learnerRoles.map(row=>row.membershipId));

   for(const item of prepared){
    activeId=item.membershipId;
    if(!validRows.has(item.membershipId)||!learners.has(item.membershipId))
     throw new BulkRuleRejected(item.membershipId,"LEARNER_NOT_FOUND");
    const ancestors=item.chain.filter(scope=>scope.scopeType!=="MEMBERSHIP");
    if(input.action!=="INHERIT"&&ancestors.length){
     const parents=await tx.select({locked:moduleAccessRules.locked})
      .from(moduleAccessRules)
      .where(and(eq(moduleAccessRules.module,input.module),or(
       ...ancestors.map(scope=>and(eq(moduleAccessRules.scopeType,scope.scopeType),
        scope.scopeId===null?isNull(moduleAccessRules.scopeId):
         eq(moduleAccessRules.scopeId,scope.scopeId)))))
      .for("share");
     if(hasPersistedAncestorLock(parents))throw new StudentRuleConflict("ANCESTOR_LOCKED");
    }
    const predicate=and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
     eq(moduleAccessRules.scopeId,item.membershipId),eq(moduleAccessRules.module,input.module));
    const [previous]=await tx.select({id:moduleAccessRules.id,
     enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
     .from(moduleAccessRules).where(predicate).for("update").limit(1);
    const before=previous?{enabled:previous.enabled,locked:previous.locked}:null;
    if(!studentRuleMatches(item.expected,before))throw new StudentRuleConflict("STALE_RULE");
    const action=input.action==="INHERIT"
     ?{action:"INHERIT" as const}
     :{action:"SET" as const,enabled:input.action==="ENABLE",locked:false};
    if(isStudentRuleNoop(before,action))continue;
    if(action.action==="INHERIT"){
     if(previous)await tx.delete(moduleAccessRules).where(eq(moduleAccessRules.id,previous.id));
    }else if(previous){
     await tx.update(moduleAccessRules).set({enabled:action.enabled,locked:action.locked,
      updatedByUserId:context.user.id,updatedAt:new Date()}).where(eq(moduleAccessRules.id,previous.id));
    }else{
     await tx.insert(moduleAccessRules).values({scopeType:"MEMBERSHIP",
      scopeId:item.membershipId,module:input.module,enabled:action.enabled,
      locked:action.locked,updatedByUserId:context.user.id});
    }
    await tx.insert(activityEvents).values({
     collegeId:college.id,organizationId:college.organizationId,actorUserId:context.user.id,
     module:"PLATFORM",eventType:ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,importance:"HIGH",
     subjectType:"MEMBERSHIP",subjectId:item.membershipId,
     summary:"Super Admin updated a learner module override",
     metadata:{module:input.module,before,after:action.action==="INHERIT"?
      null:{enabled:action.enabled,locked:action.locked}},
    });
   }
   await tx.insert(activityEvents).values({
    collegeId:college.id,organizationId:college.organizationId,
    actorUserId:context.user.id,module:"PLATFORM",
    eventType:"MODULE_ACCESS_BULK_SET",importance:"HIGH",
    subjectType:"COLLEGE",subjectId:college.id,
    summary:"Super Admin applied a bulk learner module rule",
    metadata:{module:input.module,action:input.action,
     studentCount:prepared.length,requestedCount:prepared.length,failedCount:0},
   });
   return prepared.length;
  });
  return {requested:input.membershipIds.length,applied,failures:[],auditRecorded:true};
 }catch(error){
  // A rollback means no learner was changed. Never expose SQL or credential
  // details, and do not imply earlier successful saves or a partial audit.
  return {requested:input.membershipIds.length,applied:0,
   failures:[{id:error instanceof BulkRuleRejected?error.membershipId:activeId,
    error:failureMessage(error)}],auditRecorded:true};
 }
}
