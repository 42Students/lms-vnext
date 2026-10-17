import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {inArray,and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages,placementTpoTeamAsks} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoTeamAskActionSchema,tpoTeamAskCanTransition,tpoTeamAskCreateSchema} from "./tpo-team-asks-model";

async function requireScope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
   !hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return {member,college};
}
async function hasAskTable(){return placementTableExists("placement_tpo_team_asks");}
export async function listTpoTeamAsks(context:RequestContext,threadId:string){
 const {member,college}=await requireScope(context);
 if(!await hasAskTable())return {status:"NOT_REGISTERED" as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
   )).limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  const [participants]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    eq(placementTpoInternalThreads.startedByMembershipId,member.id),
   )).limit(1);
  const [invited]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    eq(placementTpoInternalThreads.invitedMembershipId,member.id),
   )).limit(1);
  if(!participants&&!invited)throw new Error("TEAM_THREAD_NOT_FOUND");
  const items=await tx.select({
   id:placementTpoTeamAsks.id,threadId:placementTpoTeamAsks.threadId,
   title:placementTpoTeamAsks.title,dueAt:placementTpoTeamAsks.dueAt,
   status:placementTpoTeamAsks.status,doneNote:placementTpoTeamAsks.doneNote,
   createdAt:placementTpoTeamAsks.createdAt,
   askerMembershipId:placementTpoTeamAsks.askerMembershipId,
   assigneeMembershipId:placementTpoTeamAsks.assigneeMembershipId,
  }).from(placementTpoTeamAsks)
   .where(and(eq(placementTpoTeamAsks.collegeId,college.id),
    eq(placementTpoTeamAsks.threadId,threadId)))
   .orderBy(desc(placementTpoTeamAsks.createdAt),desc(placementTpoTeamAsks.id)).limit(200);
  return {status:"READY" as const,items};
 });
}
export async function createTpoTeamAsk(context:RequestContext,raw:unknown){
 const input=tpoTeamAskCreateSchema.parse(raw),{member,college}=await requireScope(context);
 if(input.assigneeMembershipId===member.id)throw new Error("TEAM_ASK_BAD_ASSIGNEE");
 const now=new Date(),dueAt=input.dueAt?new Date(input.dueAt):null;
 if(dueAt&&(dueAt.getTime()<=now.getTime()||dueAt.getTime()>now.getTime()+365*86400000))
  throw new Error("TEAM_ASK_BAD_DUE");
 if(!await hasAskTable())throw new Error("TEAM_ASKS_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({
   id:placementTpoInternalThreads.id,
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
  }).from(placementTpoInternalThreads)
   .where(and(eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id)))
   .for("update").limit(1);
  if(!thread||![thread.startedByMembershipId,thread.invitedMembershipId].includes(member.id)||
   ![thread.startedByMembershipId,thread.invitedMembershipId].includes(input.assigneeMembershipId))
   throw new Error("TEAM_THREAD_NOT_FOUND");
  const [assignee]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
   .where(and(eq(collegeMemberships.id,input.assigneeMembershipId),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .limit(1);
  if(!assignee)throw new Error("TEAM_ASK_BAD_ASSIGNEE");
  const [already]=await tx.select({
   id:placementTpoTeamAsks.id,title:placementTpoTeamAsks.title,
   dueAt:placementTpoTeamAsks.dueAt,assigneeMembershipId:placementTpoTeamAsks.assigneeMembershipId,
  }).from(placementTpoTeamAsks).where(and(
   eq(placementTpoTeamAsks.threadId,thread.id),
   eq(placementTpoTeamAsks.askerMembershipId,member.id),
   eq(placementTpoTeamAsks.requestKey,input.requestKey),
  )).limit(1);
  if(already){
   if(already.title!==input.title||
    already.assigneeMembershipId!==input.assigneeMembershipId||
    (already.dueAt?.toISOString()??null)!==(dueAt?.toISOString()??null))
    throw new Error("TEAM_ASK_STALE");
   return {id:already.id,threadId:thread.id};
  }
  const [ask]=await tx.insert(placementTpoTeamAsks).values({
   threadId:thread.id,collegeId:college.id,askerMembershipId:member.id,
   assigneeMembershipId:assignee.id,requestKey:input.requestKey,
   title:input.title,dueAt,
  }).returning({id:placementTpoTeamAsks.id});
  if(!ask)throw new Error("TEAM_ASK_CREATE_FAILED");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.ask_created",
   subjectType:"team_thread",subjectId:thread.id,
   summary:"A placement team ask was created",
   metadata:{askId:ask.id},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("TEAM_ASK_CREATE_FAILED");
  const [actor]=await tx.select({displayName:users.displayName}).from(users)
   .where(eq(users.id,context.user.id)).limit(1);
  const actorName=actor?.displayName?.trim()||"TPO colleague";
  await tx.insert(inAppNotifications).values({
   userId:assignee.userId,eventId:event.id,title:actorName+" asked you",
   body:input.title.slice(0,120),
   actionHref:"/tpo/team/"+thread.id+"?ask="+ask.id,
  });
  return {id:ask.id,threadId:thread.id};
 });
}
export async function changeTpoTeamAsk(context:RequestContext,raw:unknown){
 const input=tpoTeamAskActionSchema.parse(raw),{member,college}=await requireScope(context);
 if(!await hasAskTable())throw new Error("TEAM_ASKS_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
  }).from(placementTpoInternalThreads).where(and(
   eq(placementTpoInternalThreads.id,input.threadId),
   eq(placementTpoInternalThreads.collegeId,college.id),
  )).limit(1);
  if(!thread||![thread.startedByMembershipId,thread.invitedMembershipId].includes(member.id))
   throw new Error("TEAM_THREAD_NOT_FOUND");
  const [ask]=await tx.select({
   id:placementTpoTeamAsks.id,title:placementTpoTeamAsks.title,
   status:placementTpoTeamAsks.status,
   askerMembershipId:placementTpoTeamAsks.askerMembershipId,
   assigneeMembershipId:placementTpoTeamAsks.assigneeMembershipId,
  }).from(placementTpoTeamAsks).where(and(
   eq(placementTpoTeamAsks.id,input.askId),
   eq(placementTpoTeamAsks.collegeId,college.id),
   eq(placementTpoTeamAsks.threadId,input.threadId),
  )).for("update").limit(1);
  if(!ask)throw new Error("TEAM_ASK_NOT_FOUND");
  if(!tpoTeamAskCanTransition(input.action,member.id,ask.askerMembershipId,ask.assigneeMembershipId))
   throw new AuthorizationError("placements.manage");
  if(ask.status!==input.expectedStatus)throw new Error("TEAM_ASK_STALE");
  const nextStatus=input.action==="DONE"?"DONE" as const:"CANCELLED" as const;
  await tx.update(placementTpoTeamAsks).set({
   status:nextStatus,doneNote:input.action==="DONE"&&input.note?input.note:null,updatedAt:new Date(),
  }).where(and(eq(placementTpoTeamAsks.id,ask.id),
   eq(placementTpoTeamAsks.collegeId,college.id),eq(placementTpoTeamAsks.status,"OPEN")));
  if(input.action==="DONE"&&input.note){
   await tx.insert(placementTpoInternalMessages).values({
    threadId:input.threadId,collegeId:college.id,authorMembershipId:member.id,body:input.note,
   });
  }
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PLACEMENTS",
   eventType:nextStatus==="DONE"?"placements.tpo_team.ask_done":"placements.tpo_team.ask_cancelled",
   subjectType:"team_thread",subjectId:input.threadId,
   summary:nextStatus==="DONE"?"A placement team ask was completed":"A placement team ask was cancelled",
   metadata:{askId:ask.id},
  }).returning({id:activityEvents.id});
  const notifyMembershipId=input.action==="DONE"?ask.askerMembershipId:ask.assigneeMembershipId;
  const [recipient]=await tx.select({userId:collegeMemberships.userId})
   .from(collegeMemberships).where(and(eq(collegeMemberships.id,notifyMembershipId),
    eq(collegeMemberships.collegeId,college.id))).limit(1);
  if(event&&recipient)await tx.insert(inAppNotifications).values({
   userId:recipient.userId,eventId:event.id,
   title:nextStatus==="DONE"?"Team ask done":"Team ask cancelled",
   body:ask.title.slice(0,120),
   actionHref:"/tpo/team/"+input.threadId+"?ask="+ask.id,
  });
  return {id:ask.id,status:nextStatus};
 });
}
