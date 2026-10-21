import "server-only";
import {and,eq,inArray,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,membershipRoles,moduleAccessRules,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {buildModuleAccessChain,resolveOptionalModuleAccessForChain,type ModuleAccessScope} from "./service";
import {studentRuleMatches} from "./admin-student-rule-model";

const moduleSchema=z.enum(["projects","electives"]);
const idList=z.array(z.uuid()).min(1).max(25).refine(
  value=>new Set(value).size===value.length,"Duplicate learner selection");
const expectations=z.array(z.strictObject({
  membershipId:z.uuid(),enabled:z.boolean().nullable(),locked:z.boolean(),
})).min(1).max(25);
const previewSchema=z.strictObject({
  action:z.literal("PREVIEW"),module:moduleSchema,membershipIds:idList,
});
const applySchema=z.strictObject({
  action:z.literal("APPLY"),module:moduleSchema,
  operation:z.enum(["ENABLE","DISABLE","INHERIT"]),
  membershipIds:idList,expected:expectations,confirmed:z.literal(true),
});
type Previous={enabled:boolean;locked:boolean}|null;
type Preview={
  membershipId:string;name:string;
  enabled:boolean;level:string;winnerLocked:boolean;
  stored:Previous;ancestors:ModuleAccessScope[];
};

/** Current college membership is authoritative; never accept a browser-selected
 * tenant or an acting-in-college Super Admin scope on the College Admin route.
 * Per-learner chains are reconstructed from DB identity, not from user input. */
function collegeActor(context:RequestContext){
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    context.membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
    throw new AuthorizationError("people.manage");
  const {collegeId,organizationId}=context.membership;
  requirePermission(context,"people.manage",{collegeId,organizationId});
  return {collegeId,organizationId};
}
async function prepare(context:RequestContext,module:z.infer<typeof moduleSchema>,
  ids:readonly string[]):Promise<Preview[]>{
  const scope=collegeActor(context);
  const db=getDb();
  const result:Preview[]=[];
  for(const membershipId of [...ids].sort()){
    const [person]=await db.select({
      id:collegeMemberships.id,userId:users.id,
      identityUid:users.identityUid,name:users.displayName,
    }).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .where(and(eq(collegeMemberships.id,membershipId),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"))).limit(1);
    if(!person)throw new Error("LEARNER_UNAVAILABLE");
    const learner:RequestContext={
      user:{id:person.userId,identityUid:person.identityUid,
        platformStatus:"ACTIVE",systemRoles:[]},
      membership:{id:person.id,collegeId:scope.collegeId,
        organizationId:scope.organizationId,status:"ACTIVE",roles:["LEARNER"]},
    };
    const chain=await buildModuleAccessChain(learner);
    const current=await resolveOptionalModuleAccessForChain(chain);
    const [stored]=await db.select({enabled:moduleAccessRules.enabled,
      locked:moduleAccessRules.locked}).from(moduleAccessRules)
      .where(and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
        eq(moduleAccessRules.scopeId,person.id),
        eq(moduleAccessRules.module,module))).limit(1);
    result.push({
      membershipId:person.id,name:person.name??"Student",
      enabled:current[module].enabled,
      level:current[module].level,
      winnerLocked:current[module].locked,
      stored:stored??null,
      ancestors:chain.filter(entry=>entry.scopeType!=="MEMBERSHIP"),
    });
  }
  return result;
}

export async function previewCollegeStudentModuleBulk(
  context:RequestContext,raw:unknown){
  const input=previewSchema.parse(raw);
  return {items:(await prepare(context,input.module,input.membershipIds))
    .map(({membershipId,name,enabled,level,winnerLocked,stored})=>({
      membershipId,name,effective:enabled,winnerLevel:level,
      winnerLocked,stored,
    }))};
}

/** Transactional group of <=25 with actor role revocation locks and scoped
 * learner locks. Old null override maps to deleting the membership row, not
 * writing enabled=false; the central resolver then inherits defaults. */
export async function applyCollegeStudentModuleBulk(
  context:RequestContext,raw:unknown){
  const input=applySchema.parse(raw);
  const scope=collegeActor(context);
  if(input.expected.length!==input.membershipIds.length||
    new Set(input.expected.map(row=>row.membershipId)).size!==input.expected.length||
    input.membershipIds.some(id=>!input.expected.some(row=>row.membershipId===id)))
    throw new Error("INVALID_BULK_PREVIEW");
  const prepared=await prepare(context,input.module,input.membershipIds);
  const expected=new Map(input.expected.map(({membershipId,enabled,locked})=>
    [membershipId,enabled===null?null:{enabled,locked}] as const));
  // Fail on stale previews before acquiring write locks; a second verification
  // of every stored membership rule happens in the fenced transaction.
  for(const item of prepared){
    if(!studentRuleMatches(expected.get(item.membershipId)??null,item.stored))
      throw new Error("STALE_BULK_PREVIEW");
  }
  const result=await getDb().transaction(async tx=>{
    const [college]=await tx.select({id:colleges.id,
      organizationId:colleges.organizationId,status:colleges.status})
      .from(colleges).where(eq(colleges.id,scope.collegeId))
      .for("update").limit(1);
    if(!college||college.status!=="ACTIVE"||
      college.organizationId!==scope.organizationId)
      throw new AuthorizationError("people.manage");
    const actor=await assertPersistedPlatformPermission(
      tx,context,"people.manage",scope);
    if(!actor.membership||actor.membership.id!==context.membership?.id||
      !actor.membership.roles.includes("COLLEGE_ADMIN"))
      throw new AuthorizationError("people.manage");
    const ids=prepared.map(item=>item.membershipId);
    const members=await tx.select({id:collegeMemberships.id,
      status:collegeMemberships.status,userStatus:users.platformStatus})
      .from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(eq(collegeMemberships.collegeId,scope.collegeId),
        inArray(collegeMemberships.id,ids)))
      .orderBy(collegeMemberships.id)
      .for("update",{of:collegeMemberships});
    const live=new Set(members.filter(m=>m.status==="ACTIVE"&&
      m.userStatus==="ACTIVE").map(m=>m.id));
    const roles=await tx.select({id:membershipRoles.membershipId})
      .from(membershipRoles).where(and(
        inArray(membershipRoles.membershipId,ids),
        eq(membershipRoles.role,"LEARNER"))).for("share");
    const learnerRoles=new Set(roles.map(row=>row.id));
    if(prepared.some(item=>!live.has(item.membershipId)||
      !learnerRoles.has(item.membershipId)))
      throw new Error("LEARNER_UNAVAILABLE");
    let changed=0;
    for(const item of prepared){
      const old=expected.get(item.membershipId)??null;
      if(input.operation!=="INHERIT"){
        const ancestry=item.ancestors.map(entry=>and(
          eq(moduleAccessRules.scopeType,entry.scopeType),
          entry.scopeId===null?isNull(moduleAccessRules.scopeId):
            eq(moduleAccessRules.scopeId,entry.scopeId),
        ));
        if(ancestry.length){
          const parents=await tx.select({locked:moduleAccessRules.locked})
            .from(moduleAccessRules).where(and(
              eq(moduleAccessRules.module,input.module),or(...ancestry)))
            .for("share");
          if(parents.some(row=>row.locked))
            throw new Error("ANCESTOR_RULE_LOCKED");
        }
      }
      const predicate=and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),
        eq(moduleAccessRules.scopeId,item.membershipId),
        eq(moduleAccessRules.module,input.module));
      const [previous]=await tx.select({id:moduleAccessRules.id,
        enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
        .from(moduleAccessRules).where(predicate).for("update").limit(1);
      const actual:Previous=previous?
        {enabled:previous.enabled,locked:previous.locked}:null;
      if(!studentRuleMatches(old,actual))throw new Error("STALE_BULK_PREVIEW");
      if(previous?.locked)throw new Error("LOCKED_LEARNER_RULE");
      const desired=input.operation==="INHERIT"?null:{
        enabled:input.operation==="ENABLE",locked:false};
      if(studentRuleMatches(actual,desired))continue;
      if(desired===null){
        if(previous)await tx.delete(moduleAccessRules)
          .where(eq(moduleAccessRules.id,previous.id));
      }else if(previous){
        await tx.update(moduleAccessRules).set({
          enabled:desired.enabled,locked:false,updatedByUserId:context.user.id,
          updatedAt:new Date(),
        }).where(eq(moduleAccessRules.id,previous.id));
      }else{
        await tx.insert(moduleAccessRules).values({
          scopeType:"MEMBERSHIP",scopeId:item.membershipId,
          module:input.module,enabled:desired.enabled,locked:false,
          updatedByUserId:context.user.id,
        });
      }
      changed++;
      await tx.insert(activityEvents).values({
        organizationId:scope.organizationId,collegeId:scope.collegeId,
        actorUserId:context.user.id,module:"PLATFORM",
        eventType:"MODULE_ACCESS_BULK_SET",importance:"HIGH",
        subjectType:"MEMBERSHIP",subjectId:item.membershipId,
        summary:"College Admin changed learner module access",
        metadata:{module:input.module,before:actual,after:desired,
          action:input.operation},
      });
    }
    return changed;
  });
  return {requested:input.membershipIds.length,applied:input.membershipIds.length,
    changed:result,unchanged:input.membershipIds.length-result};
}
