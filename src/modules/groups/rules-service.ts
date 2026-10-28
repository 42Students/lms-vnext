import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, departments, learnerProgramEnrollments,
  lmsGroupMemberEvents, lmsGroupMembers, lmsGroupRules, lmsGroups,
  membershipRoles, placementCandidateAcademicEvidence, programs, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedGroupActor } from "./actor-access";
import {
  groupRuleCriteriaSchema, matchesGroupRuleCandidate,
  type GroupRuleCriteria,
} from "./rule-evaluator";

const uuid=z.string().uuid();
const inputSchema=z.object({
  criteria:groupRuleCriteriaSchema,
  autoRefresh:z.boolean().default(false),
}).strict();

export function groupRuleFeatureOwnerMessage(kind:string):string|null {
 if(kind==="ELECTIVE")return "Elective groups are managed from the Electives page";
 if(kind==="PROJECT_TEAM")return "Project team groups are managed from the project's Team tab";
 return null;
}
export class GroupRuleServiceError extends Error {
  constructor(public readonly code:string,detail?:string){
   super(detail??code); this.name="GroupRuleServiceError";
  }
}
type Client=ReturnType<typeof getDb>;
type Tx=Parameters<Parameters<Client["transaction"]>[0]>[0];
async function requireGroupManagement(tx:Tx,context:RequestContext,groupId:string) {
  const [group]=await tx.select().from(lmsGroups)
    .where(eq(lmsGroups.id,groupId)).for("update");
  if (!group || group.deletedAt || group.status==="ARCHIVED" ||
      group.ownerScope!=="COLLEGE" || !group.collegeId)
    throw new GroupRuleServiceError("GROUP_RULE_GROUP_NOT_MANAGEABLE");
  requirePermission(context,"academics.manage",{collegeId:group.collegeId});
  await assertPersistedGroupActor(tx, context, {collegeId:group.collegeId,mode:"MANUAL"});
  // Electives require slot-scoped locks and project teams require transactional
  // mirrors; never write either through this generic rule runner.
  const featureOwnerMessage=groupRuleFeatureOwnerMessage(group.kind);
  if(featureOwnerMessage)
    throw new GroupRuleServiceError("GROUP_RULE_FEATURE_OWNER_REQUIRED",featureOwnerMessage);
  return group;
}
async function assertCriteriaCollege(tx:Tx, collegeId:string, criteria:GroupRuleCriteria) {
  if (criteria.allowedProgramIds.length) {
    const ids=await tx.select({id:programs.id}).from(programs)
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(inArray(programs.id,criteria.allowedProgramIds),
        eq(departments.collegeId,collegeId)));
    if (ids.length!==new Set(criteria.allowedProgramIds).size)
      throw new GroupRuleServiceError("GROUP_RULE_PROGRAM_COLLEGE_MISMATCH");
  }
  if (criteria.allowedCohortIds.length) {
    const ids=await tx.select({id:cohorts.id}).from(cohorts)
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(inArray(cohorts.id,criteria.allowedCohortIds),
        eq(departments.collegeId,collegeId)));
    if (ids.length!==new Set(criteria.allowedCohortIds).size)
      throw new GroupRuleServiceError("GROUP_RULE_COHORT_COLLEGE_MISMATCH");
  }
}
export async function upsertGroupRule(context:RequestContext,groupIdInput:string,raw:unknown) {
  const groupId=uuid.parse(groupIdInput);
  const {criteria,autoRefresh}=inputSchema.parse(raw);
  return getDb().transaction(async tx => {
    const group=await requireGroupManagement(tx,context,groupId);
    await assertCriteriaCollege(tx,group.collegeId!,criteria);
    const [row]=await tx.insert(lmsGroupRules).values({
      groupId,criteriaJson:criteria,criteriaVersion:1,autoRefresh,
    }).onConflictDoUpdate({
      target:lmsGroupRules.groupId,
      set:{criteriaJson:criteria,criteriaVersion:1,autoRefresh,
        updatedAt:new Date()},
    }).returning();
    return row!;
  });
}

/** A manual application requires a fresh group version; save-only never
 * changes enrollment. The version check runs after the group row lock. */
export async function refreshGroupRule(context:RequestContext,groupIdInput:string,
 expectedGroupVersion?:number) {
  const groupId=uuid.parse(groupIdInput);
  return getDb().transaction(async tx => {
    const group=await requireGroupManagement(tx,context,groupId);
    if(expectedGroupVersion!==undefined&&group.version!==expectedGroupVersion)
      throw new GroupRuleServiceError("GROUP_RULE_STALE_VERSION");
    // Setting up a rule is allowed on a draft group. Materializing its
    // membership roster is not: only ACTIVE groups can enroll learners.
    if (group.status!=="ACTIVE")
      throw new GroupRuleServiceError("GROUP_RULE_GROUP_NOT_ACTIVE");
    const [rule]=await tx.select().from(lmsGroupRules)
      .where(eq(lmsGroupRules.groupId,groupId)).limit(1);
    if (!rule) throw new GroupRuleServiceError("GROUP_RULE_NOT_FOUND");
    if (rule.criteriaVersion!==1)
      throw new GroupRuleServiceError("GROUP_RULE_VERSION_UNSUPPORTED");
    // Unknown criteria MUST fail closed: never treat unfamiliar legacy JSON
    // as a filter-free instruction to enroll everyone in the college.
    const criteria=groupRuleCriteriaSchema.parse(rule.criteriaJson);
    await assertCriteriaCollege(tx,group.collegeId!,criteria);
    const candidates=await tx.select({
      membershipId:collegeMemberships.id,
      programId:learnerProgramEnrollments.programId,
      cohortId:learnerProgramEnrollments.cohortId,
      cgpaHundredths:placementCandidateAcademicEvidence.cgpaHundredths,
      activeBacklogs:placementCandidateAcademicEvidence.activeBacklogs,
      passingYear:placementCandidateAcademicEvidence.passingYear,
    }).from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
      .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .leftJoin(placementCandidateAcademicEvidence,
        eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id))
      .where(and(eq(departments.collegeId,group.collegeId!),
        eq(collegeMemberships.collegeId,group.collegeId!),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(learnerProgramEnrollments.status,"ACTIVE")))
      .orderBy(asc(collegeMemberships.id));

    const matches=new Set<string>();
    for(const candidate of candidates) {
      if(matchesGroupRuleCandidate(criteria,candidate)) matches.add(candidate.membershipId);
    }
    const current=await tx.select().from(lmsGroupMembers)
      .where(eq(lmsGroupMembers.groupId,groupId))
      .orderBy(asc(lmsGroupMembers.createdAt),asc(lmsGroupMembers.id));
    const old=new Map(current.map(row=>[row.membershipId,row]));
    const now=new Date();
    let active=current.filter(row=>row.state==="ACTIVE").length;
    let waitlistPosition=Math.max(0,...current.filter(row=>row.state==="WAITLISTED")
      .map(row=>row.waitlistPosition ?? 0));
    let added=0,removed=0,promoted=0,waitlisted=0,skippedCapacity=0,skippedOverride=0;

    for(const member of current) {
      if (matches.has(member.membershipId) || member.source!=="RULE" ||
          member.isLocked || (member.state!=="ACTIVE" && member.state!=="WAITLISTED"))
        continue;
      await tx.update(lmsGroupMembers).set({
        state:"REMOVED",waitlistPosition:null,updatedAt:now,
        version:sql`${lmsGroupMembers.version} + 1`,
      }).where(eq(lmsGroupMembers.id,member.id));
      if(member.state==="ACTIVE") active-=1;
      await tx.insert(lmsGroupMemberEvents).values({
        groupId,membershipId:member.membershipId,fromState:member.state,
        toState:"REMOVED",source:"RULE",actorType:"SYSTEM",actorUserId:null,
        reason:"RULE_REFRESH_NO_LONGER_ELIGIBLE",
      });
      removed++;
      old.set(member.membershipId,{...member,state:"REMOVED"});
    }

    // A rule-refresh can free seats after removing stale RULE members. Existing
    // eligible waitlisted RULE members have priority over fresh matches. Locked
    // or human-managed memberships are NOT implicitly changed by this runner.
    const existingWaitlist=current
      .filter(row=>row.state==="WAITLISTED" && row.source==="RULE" &&
        !row.isLocked && matches.has(row.membershipId))
      .sort((a,b)=>(a.waitlistPosition??Number.MAX_SAFE_INTEGER) -
                   (b.waitlistPosition??Number.MAX_SAFE_INTEGER) ||
                   a.createdAt.getTime()-b.createdAt.getTime());
    for(const member of existingWaitlist) {
      if(group.capacity!==null && active>=group.capacity) break;
      await tx.update(lmsGroupMembers).set({
        state:"ACTIVE",waitlistPosition:null,joinedAt:now,updatedAt:now,
        version:sql`${lmsGroupMembers.version} + 1`,
      }).where(eq(lmsGroupMembers.id,member.id));
      await tx.insert(lmsGroupMemberEvents).values({
        groupId,membershipId:member.membershipId,fromState:"WAITLISTED",
        toState:"ACTIVE",source:"RULE",actorType:"SYSTEM",actorUserId:null,
        reason:"RULE_REFRESH_WAITLIST_PROMOTION",
      });
      active++; promoted++;
      old.set(member.membershipId,{...member,state:"ACTIVE",waitlistPosition:null});
    }

    for(const membershipId of [...matches].sort()) {
      const prior=old.get(membershipId);
      // Manual/CSV/SELF and all locked states are human/consent overrides.
      if(prior && (prior.isLocked || prior.source!=="RULE" ||
        prior.state==="ACTIVE" || prior.state==="WAITLISTED")) {
        if(prior.isLocked || prior.source!=="RULE") skippedOverride++;
        continue;
      }
      const available=group.capacity===null || active<group.capacity;
      // Legacy group kernel: absent/non-boolean allowWaitlist defaults to true.
      // Only an explicit false may reject a RULE-matched overflow candidate.
      if(!available && group.configJson["allowWaitlist"]===false) {
        skippedCapacity++; continue;
      }
      const state:"ACTIVE"|"WAITLISTED"=available?"ACTIVE":"WAITLISTED";
      const position=state==="WAITLISTED"?++waitlistPosition:null;
      if(prior) {
        await tx.update(lmsGroupMembers).set({
          state,source:"RULE",isLocked:false,waitlistPosition:position,
          joinedAt:available?now:null,updatedAt:now,
          version:sql`${lmsGroupMembers.version} + 1`,
        }).where(eq(lmsGroupMembers.id,prior.id));
      } else {
        await tx.insert(lmsGroupMembers).values({
          groupId,membershipId,state,source:"RULE",isLocked:false,
          waitlistPosition:position,joinedAt:available?now:null,
        });
      }
      await tx.insert(lmsGroupMemberEvents).values({
        groupId,membershipId,fromState:prior?.state??null,toState:state,
        source:"RULE",actorType:"SYSTEM",actorUserId:null,
        reason:"RULE_REFRESH_MATCHED",
      });
      added++;
      if(available) active++; else waitlisted++;
    }
    await tx.update(lmsGroups).set({
      activeCount:active,version:sql`${lmsGroups.version} + 1`,updatedAt:now,
    }).where(eq(lmsGroups.id,groupId));
    await tx.update(lmsGroupRules).set({
      lastRunAt:now,lastRunMatched:matches.size,updatedAt:now,
    }).where(eq(lmsGroupRules.id,rule.id));
    return {matched:matches.size,active,added,removed,promoted,waitlisted,
      skippedCapacity,skippedOverride,groupVersion:group.version+1};
  });
}

/** Clear the automatic rule, never deleting any historical/manual group
 * membership. A reactivation of earlier RULE members needs a new rule + Apply.
 * Every change remains scoped to this college's authorized group. */
export async function clearGroupRule(context:RequestContext,groupIdInput:string,
 expectedGroupVersion:number){
 const groupId=uuid.parse(groupIdInput);
 if(!Number.isSafeInteger(expectedGroupVersion)||expectedGroupVersion<0)
   throw new GroupRuleServiceError("GROUP_RULE_STALE_VERSION");
 return getDb().transaction(async tx=>{
  const group=await requireGroupManagement(tx,context,groupId);
  if(group.version!==expectedGroupVersion)
   throw new GroupRuleServiceError("GROUP_RULE_STALE_VERSION");
  const deleted=await tx.delete(lmsGroupRules).where(eq(lmsGroupRules.groupId,groupId))
   .returning({id:lmsGroupRules.id});
  if(deleted.length===0)return {cleared:false,groupVersion:group.version};
  await tx.update(lmsGroups).set({version:sql`${lmsGroups.version}+1`,
    updatedAt:new Date()}).where(eq(lmsGroups.id,groupId));
  return {cleared:true,groupVersion:group.version+1};
 });
}
