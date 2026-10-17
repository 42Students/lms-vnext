import "server-only";
import {and,asc,desc,eq} from "drizzle-orm";
import {canPostToTpoCompanyTeam,tpoCompanyTeamCompanyIdSchema,tpoCompanyTeamPostSchema} from "./tpo-company-team-model";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,placementCompanies,placementCompanyRelationships,users} from "@/db/schema";
import {placementTpoCompanyThreads,placementTpoCompanyThreadMessages} from "@/db/schema/tpo-company-team";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

async function scope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
    !hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return {member,college};
}
async function ready(){
 return await placementTableExists("placement_tpo_company_threads")&&
  await placementTableExists("placement_tpo_company_thread_messages");
}
/** The relationship is the object; never create one for a global company
 * without explicit active college relationship membership. */
export async function readTpoCompanyTeam(context:RequestContext,rawCompanyId:unknown){
 const companyId=tpoCompanyTeamCompanyIdSchema.parse(rawCompanyId),{college}=await scope(context);
 if(!await ready())return {status:"NOT_REGISTERED" as const};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [relation]=await tx.select({
   id:placementCompanyRelationships.id,status:placementCompanyRelationships.status,
   companyName:placementCompanies.name,
  }).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.companyId,companyId))).limit(1);
  if(!relation)return {status:"NOT_FOUND" as const};
  const [thread]=await tx.select({
   id:placementTpoCompanyThreads.id,topic:placementTpoCompanyThreads.topic,
  }).from(placementTpoCompanyThreads).where(and(
   eq(placementTpoCompanyThreads.collegeId,college.id),
   eq(placementTpoCompanyThreads.relationshipId,relation.id))).limit(1);
  const messages=thread?await tx.select({
   id:placementTpoCompanyThreadMessages.id,body:placementTpoCompanyThreadMessages.body,
   createdAt:placementTpoCompanyThreadMessages.createdAt,
   authorName:users.displayName,
  }).from(placementTpoCompanyThreadMessages)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementTpoCompanyThreadMessages.authorMembershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(placementTpoCompanyThreadMessages.threadId,thread.id),
    eq(placementTpoCompanyThreadMessages.collegeId,college.id)))
   .orderBy(desc(placementTpoCompanyThreadMessages.createdAt),desc(placementTpoCompanyThreadMessages.id))
   .limit(100):[];
  return {status:"READY" as const,companyId,companyName:relation.companyName,
   canPost:canPostToTpoCompanyTeam(relation.status),topic:thread?.topic??relation.companyName,
   messages:messages.reverse()};
 });
}
/** Each first post creates at most one company thread in a college; retries
 * return the original message and cannot deliver duplicate bell events. */
export async function postTpoCompanyTeamMessage(
 context:RequestContext,rawCompanyId:unknown,raw:unknown,
){
 const companyId=tpoCompanyTeamCompanyIdSchema.parse(rawCompanyId),input=tpoCompanyTeamPostSchema.parse(raw);
 const {member,college}=await scope(context);
 if(!await ready())throw new Error("TPO_COMPANY_TEAM_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [relation]=await tx.select({
   id:placementCompanyRelationships.id,name:placementCompanies.name,
  }).from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.companyId,companyId),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .for("update").limit(1);
  if(!relation)throw new Error("TPO_COMPANY_TEAM_NOT_FOUND");
  await tx.insert(placementTpoCompanyThreads).values({
   collegeId:college.id,relationshipId:relation.id,createdByMembershipId:member.id,
   topic:relation.name.slice(0,200),
  }).onConflictDoNothing();
  const [thread]=await tx.select({id:placementTpoCompanyThreads.id})
   .from(placementTpoCompanyThreads).where(and(
    eq(placementTpoCompanyThreads.collegeId,college.id),
    eq(placementTpoCompanyThreads.relationshipId,relation.id))).limit(1);
  if(!thread)throw new Error("TPO_COMPANY_TEAM_NOT_FOUND");
  const [inserted]=await tx.insert(placementTpoCompanyThreadMessages).values({
   threadId:thread.id,collegeId:college.id,authorMembershipId:member.id,
   body:input.body,idempotencyKey:input.idempotencyKey,
  }).onConflictDoNothing().returning({id:placementTpoCompanyThreadMessages.id});
  const [message]=await tx.select({
   id:placementTpoCompanyThreadMessages.id,body:placementTpoCompanyThreadMessages.body,
  }).from(placementTpoCompanyThreadMessages).where(and(
   eq(placementTpoCompanyThreadMessages.threadId,thread.id),
   eq(placementTpoCompanyThreadMessages.collegeId,college.id),
   eq(placementTpoCompanyThreadMessages.authorMembershipId,member.id),
   eq(placementTpoCompanyThreadMessages.idempotencyKey,input.idempotencyKey))).limit(1);
  if(!message||message.body!==input.body)throw new Error("TPO_COMPANY_TEAM_IDEMPOTENCY_CONFLICT");
  if(inserted){
   const [event]=await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:member.id,
    module:"PLACEMENTS",eventType:"placements.tpo_team.company_message",
    subjectType:"placement_company_relationship",subjectId:relation.id,
    summary:"Team discussion on company",
    metadata:{threadId:thread.id,messageId:message.id,companyId},
   }).returning({id:activityEvents.id});
   if(event){
    const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
     .from(collegeMemberships)
     .innerJoin(users,eq(users.id,collegeMemberships.userId))
     .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"TPO")))
     .where(and(eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
     .orderBy(asc(collegeMemberships.userId)).limit(501);
    if(recipients.length>500)throw new Error("TPO_NOTIFICATION_RECIPIENT_LIMIT");
    if(recipients.length)await tx.insert(inAppNotifications).values(
     recipients.map(({userId})=>({
      userId,eventId:event.id,title:"Team update on "+relation.name.slice(0,80),
      body:input.body.slice(0,120),
      actionHref:"/tpo/companies/"+companyId+"/team?m="+message.id,
     }))).onConflictDoNothing();
   }
  }
  return {id:message.id,threadId:thread.id,created:Boolean(inserted)};
 });
}
