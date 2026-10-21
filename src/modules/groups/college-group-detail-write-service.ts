import "server-only";
import {and,asc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,collegeMemberships,departments,lmsGroupMembers,lmsGroupMemberEvents,
  lmsGroupRules,lmsGroups,membershipRoles,programs,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {assertPersistedGroupActor,GroupActorAccessError} from "./actor-access";
import {collegeGroupDetailIdSchema,collegeGroupDetailWriteSchema,collegeWaitlistPromotionBlocker} from "./college-group-detail-write-model";

/** Legacy AdminGroupController route matrix under membership-scoped UUIDs.
 * Numeric learner IDs are resolved by the import adapter, not here; the
 * import service applies tenant checks and preserves MANUAL/CSV event source.
 * Rule preview is read-only; explicit apply/clear use the version-locked
 * rule action endpoint. Locked and waitlisted rows keep their CAS guards.
 */
export const COLLEGE_GROUP_ADMIN_ACTION_ROUTES={
 members:"/api/college/groups/import",
 bulkAdd:"/api/college/groups/import",
 validation:"/api/college/groups/import-preview",
 ruleSave:"/api/college/groups/[groupId]/detail-actions",
 rulePreview:"/college/groups/[groupId]/rule-preview",
 ruleApply:"/api/college/groups/[groupId]/rule",
 ruleClear:"/api/college/groups/[groupId]/rule",
 promoteWaitlist:"/api/college/groups/[groupId]/detail-actions",
} as const;

export class CollegeGroupDetailWriteError extends Error {
  constructor(public readonly code:"GROUP_NOT_FOUND"|"GROUP_STALE"|
    "MEMBER_NOT_FOUND"|"MEMBER_STALE"|"WAITLIST_OUT_OF_ORDER"|"GROUP_CAPACITY_FULL"|
    "GROUP_NOT_ACTIVE"|"RULE_UNSUPPORTED"|"RULE_FOREIGN_SCOPE"){
    super(code);this.name="CollegeGroupDetailWriteError";
  }
}
export async function writeCollegeGroupDetail(context:RequestContext,rawId:unknown,raw:unknown){
  const groupId=collegeGroupDetailIdSchema.parse(rawId);
  const input=collegeGroupDetailWriteSchema.parse(raw);
  const actor=context.membership;
  if(!actor||actor.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"academics.manage",{collegeId:actor.collegeId,organizationId:actor.organizationId}))
    throw new AuthorizationError("academics.manage");
  requirePermission(context,"academics.manage",{
    collegeId:actor.collegeId,organizationId:actor.organizationId,
  });
  return getDb().transaction(async tx=>{
    const [group]=await tx.select().from(lmsGroups).where(and(
      eq(lmsGroups.id,groupId),eq(lmsGroups.collegeId,actor.collegeId),
      eq(lmsGroups.ownerScope,"COLLEGE"),eq(lmsGroups.kind,"STUDY_GROUP"),isNull(lmsGroups.deletedAt),
    )).for("update").limit(1);
    if(!group||group.status==="ARCHIVED")throw new CollegeGroupDetailWriteError("GROUP_NOT_FOUND");
    if(group.version!==input.expectedGroupVersion)throw new CollegeGroupDetailWriteError("GROUP_STALE");
    try {
      await assertPersistedGroupActor(tx,context,{collegeId:actor.collegeId,mode:"MANUAL"});
    }catch(error){
      if(error instanceof GroupActorAccessError)throw new AuthorizationError("academics.manage");
      throw error;
    }
    if(input.action==="SAVE_RULE"){
      const criteria=input.criteria;
      if(criteria.allowedProgramIds.length){
        const actual=await tx.select({id:programs.id}).from(programs)
          .innerJoin(departments,and(eq(departments.id,programs.departmentId),
            eq(departments.collegeId,actor.collegeId)))
          .where(inArray(programs.id,criteria.allowedProgramIds));
        if(actual.length!==new Set(criteria.allowedProgramIds).size)
          throw new CollegeGroupDetailWriteError("RULE_FOREIGN_SCOPE");
      }
      if(criteria.allowedCohortIds.length){
        const actual=await tx.select({id:cohorts.id}).from(cohorts)
          .innerJoin(programs,eq(programs.id,cohorts.programId))
          .innerJoin(departments,and(eq(departments.id,programs.departmentId),
            eq(departments.collegeId,actor.collegeId)))
          .where(inArray(cohorts.id,criteria.allowedCohortIds));
        if(actual.length!==new Set(criteria.allowedCohortIds).size)
          throw new CollegeGroupDetailWriteError("RULE_FOREIGN_SCOPE");
      }
      const [existing]=await tx.select({criteriaVersion:lmsGroupRules.criteriaVersion})
        .from(lmsGroupRules).where(eq(lmsGroupRules.groupId,group.id)).limit(1);
      if(existing&&existing.criteriaVersion!==1)throw new CollegeGroupDetailWriteError("RULE_UNSUPPORTED");
      await tx.insert(lmsGroupRules).values({
        groupId:group.id,criteriaJson:criteria,criteriaVersion:1,autoRefresh:input.autoRefresh,
      }).onConflictDoUpdate({
        target:lmsGroupRules.groupId,
        set:{criteriaJson:criteria,criteriaVersion:1,autoRefresh:input.autoRefresh,updatedAt:new Date()},
      });
      await tx.update(lmsGroups).set({version:sql`${lmsGroups.version}+1`,updatedAt:new Date()})
        .where(eq(lmsGroups.id,group.id));
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED,
        organizationId:actor.organizationId,collegeId:actor.collegeId,
        subjectType:"lms_group",subjectId:group.id,subjectLabel:group.name,
        summary:"College Admin updated group eligibility rule",
        metadata:{criteriaVersion:1,autoRefresh:input.autoRefresh},
      });
      return {action:input.action,groupVersion:group.version+1};
    }
    if(group.status!=="ACTIVE")throw new CollegeGroupDetailWriteError("GROUP_NOT_ACTIVE");
    const [membership]=await tx.select({
      id:collegeMemberships.id,status:collegeMemberships.status,accountStatus:users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .where(and(eq(collegeMemberships.id,input.memberId),
        eq(collegeMemberships.collegeId,actor.collegeId)))
      .for("share").limit(1);
    if(!membership||membership.status!=="ACTIVE"||membership.accountStatus!=="ACTIVE")
      throw new CollegeGroupDetailWriteError("MEMBER_NOT_FOUND");
    const [member]=await tx.select().from(lmsGroupMembers)
      .where(and(eq(lmsGroupMembers.groupId,group.id),
        eq(lmsGroupMembers.membershipId,input.memberId))).for("update").limit(1);
    if(!member)
      throw new CollegeGroupDetailWriteError("MEMBER_NOT_FOUND");
    const [front]=await tx.select({id:lmsGroupMembers.id})
      .from(lmsGroupMembers).where(and(eq(lmsGroupMembers.groupId,group.id),
        eq(lmsGroupMembers.state,"WAITLISTED")))
      .orderBy(asc(lmsGroupMembers.waitlistPosition),asc(lmsGroupMembers.createdAt),asc(lmsGroupMembers.id))
      .limit(1);
    const blocker=collegeWaitlistPromotionBlocker({
      accountStatus:membership.accountStatus,membershipStatus:membership.status,
      state:member.state,memberType:member.memberType,locked:member.isLocked,
      memberVersion:member.version,expectedMemberVersion:input.expectedMemberVersion,
      firstInQueue:front?.id===member.id,capacity:group.capacity,activeCount:group.activeCount,
    });
    if(blocker)throw new CollegeGroupDetailWriteError(blocker);
    const now=new Date();
    await tx.update(lmsGroupMembers).set({
      state:"ACTIVE",waitlistPosition:null,joinedAt:now,
      version:sql`${lmsGroupMembers.version}+1`,updatedAt:now,
    }).where(eq(lmsGroupMembers.id,member.id));
    await tx.update(lmsGroups).set({
      activeCount:sql`${lmsGroups.activeCount}+1`,
      version:sql`${lmsGroups.version}+1`,updatedAt:now,
    }).where(eq(lmsGroups.id,group.id));
    await tx.insert(lmsGroupMemberEvents).values({
      groupId:group.id,membershipId:member.membershipId,
      fromState:"WAITLISTED",toState:"ACTIVE",memberType:"LEARNER",
      source:"MANUAL",actorType:"COLLEGE_ADMIN",actorUserId:context.user.id,
      reason:"MANUAL_WAITLIST_PROMOTION",
    });
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_GROUP_UPDATED,
      organizationId:actor.organizationId,collegeId:actor.collegeId,
      subjectType:"lms_group",subjectId:group.id,subjectLabel:group.name,
      summary:"College Admin promoted waitlisted learner",
      metadata:{memberId:member.membershipId,fromState:"WAITLISTED",toState:"ACTIVE"},
    });
    return {action:input.action,groupVersion:group.version+1,memberId:member.membershipId};
  });
}
