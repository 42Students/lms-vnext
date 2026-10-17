import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {inArray,and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,users} from "@/db/schema";
import {placementTpoTeamEveryoneMessages as messages,
 placementTpoTeamEveryoneMutes as mutes} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementTableExists} from "./staged-tables";
import {requirePlacementManageScope} from "./scope";
import {everyoneMessageSchema,everyoneMuteSchema,
 everyoneNotificationRecipients} from "./tpo-team-everyone-model";

async function scope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 if(!can(context,"placements.manage",{collegeId:member.collegeId}))
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:member.collegeId});
 const college=await requirePlacementManageScope(context,member.collegeId);
 return {college,membershipId:member.id};
}
export async function tpoEveryoneStorageReady(){
 return await placementTableExists("placement_tpo_team_everyone_messages")&&
  await placementTableExists("placement_tpo_team_everyone_mutes");
}
async function requirePersistedTpoMember(tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 collegeId:string,membershipId:string){
 const [member]=await tx.select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"]),
  ))
  .where(and(eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE")))
  .limit(1);
 if(!member)throw new AuthorizationError("placements.manage");
}
export async function readTpoTeamEveryone(context:RequestContext,page=1){
 const {college,membershipId}=await scope(context);
 if(!await tpoEveryoneStorageReady())
  return {status:"NOT_REGISTERED" as const,rows:[],muted:false,page:1,pages:1};
 const safePage=Number.isFinite(page)?Math.max(1,Math.min(10000,Math.trunc(page))):1;
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  await requirePersistedTpoMember(tx,college.id,membershipId);
  const [[total],mutedRow,items]=await Promise.all([
   tx.select({count:sql<number>`count(*)::integer`}).from(messages)
    .where(eq(messages.collegeId,college.id)),
   tx.select({id:mutes.membershipId}).from(mutes).where(and(
    eq(mutes.collegeId,college.id),eq(mutes.membershipId,membershipId))).limit(1),
   tx.select({id:messages.id,body:messages.body,authorMembershipId:messages.authorMembershipId,
    authorName:users.displayName,createdAt:messages.createdAt})
    .from(messages)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,messages.authorMembershipId),
      eq(collegeMemberships.collegeId,messages.collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(eq(messages.collegeId,college.id))
    .orderBy(desc(messages.createdAt),desc(messages.id)).limit(40).offset((safePage-1)*40),
  ]);
  return {status:"READY" as const,rows:items.reverse(),muted:mutedRow.length>0,
   page:safePage,pages:Math.max(1,Math.ceil(Number(total?.count??0)/40))};
 });
}
export async function postTpoTeamEveryoneMessage(context:RequestContext,raw:unknown){
 const input=everyoneMessageSchema.parse(raw);
 const {college,membershipId}=await scope(context);
 if(!await tpoEveryoneStorageReady())throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  await requirePersistedTpoMember(tx,college.id,membershipId);
  const [posted]=await tx.insert(messages).values({
   collegeId:college.id,authorMembershipId:membershipId,body:input.body,
  }).returning({id:messages.id});
  if(!posted)throw new Error("TEAM_MESSAGE_FAILED");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membershipId,module:"PLACEMENTS",
   eventType:"placements.tpo_team.everyone_message",subjectType:"team_everyone",
   subjectId:college.id,summary:"Everyone team message created",
   metadata:{messageId:posted.id,bodyLength:input.body.length},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("TEAM_MESSAGE_FAILED");
  const [members,mutedMembers]=await Promise.all([
   tx.select({membershipId:collegeMemberships.id,userId:collegeMemberships.userId})
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
       inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
    .where(and(eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))),
   tx.select({membershipId:mutes.membershipId}).from(mutes).where(eq(mutes.collegeId,college.id)),
  ]);
  const mutedIds=new Set(mutedMembers.map(row=>row.membershipId));
  const recipients=everyoneNotificationRecipients(
   members.map(member=>({...member,muted:mutedIds.has(member.membershipId)})),membershipId);
  if(recipients.length)await tx.insert(inAppNotifications).values(recipients.map(member=>({
   eventId:event.id,userId:member.userId,title:"Everyone",
   body:"A placement team member posted in Everyone.",actionHref:"/tpo/team/everyone",
  })));
  return {id:posted.id,notified:recipients.length};
 });
}
export async function setTpoTeamEveryoneMuted(context:RequestContext,raw:unknown){
 const {muted}=everyoneMuteSchema.parse(raw);
 const {college,membershipId}=await scope(context);
 if(!await tpoEveryoneStorageReady())throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  await requirePersistedTpoMember(tx,college.id,membershipId);
  if(muted)await tx.insert(mutes).values({
   collegeId:college.id,membershipId,
  }).onConflictDoNothing();
  else await tx.delete(mutes).where(and(eq(mutes.collegeId,college.id),
    eq(mutes.membershipId,membershipId)));
  return {muted};
 });
}
