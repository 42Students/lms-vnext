import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {createHash} from "node:crypto";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages,placementTpoInternalThreadParticipants} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {internalMessageSchema} from "./tpo-team-internal-model";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** Private groups require explicit Add and send consent before an external
 * teammate gains access to history. Names are resolved only inside the actor's
 * scoped college and never returned as an unscoped directory search.
 */
export class TeamAddPeopleRequiredError extends Error {
 constructor(public readonly people:readonly string[]){
  super("TEAM_ADD_PEOPLE_REQUIRED");
 }
}

/** Persist and audit one internal message; participant and both users rechecked inside transaction. */
export async function postTpoInternalMessage(context:RequestContext,raw:unknown){
 const input=internalMessageSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_messages"))
  throw new Error("TEAM_TABLES_PENDING");
 const groupReady=await placementTableExists("placement_tpo_internal_thread_participants");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [thread]=await tx.select({
   id:placementTpoInternalThreads.id,
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
   isPrivate:placementTpoInternalThreads.isPrivate,
   kind:groupReady?placementTpoInternalThreads.kind:sql<"DIRECT">`'DIRECT'`,
  }).from(placementTpoInternalThreads).where(and(
   eq(placementTpoInternalThreads.id,input.threadId),
   eq(placementTpoInternalThreads.collegeId,college.id),
  )).for("update").limit(1);
  if(!thread) throw new Error("TEAM_THREAD_NOT_FOUND");
  if(thread.kind!=="DIRECT"&&!groupReady)throw new Error("TEAM_TABLES_PENDING");
  const memberIds=thread.kind==="DIRECT"
    ? [thread.startedByMembershipId,thread.invitedMembershipId]
    : (await tx.select({id:placementTpoInternalThreadParticipants.membershipId})
      .from(placementTpoInternalThreadParticipants)
      .where(and(eq(placementTpoInternalThreadParticipants.threadId,thread.id),
        eq(placementTpoInternalThreadParticipants.collegeId,college.id),
        isNull(placementTpoInternalThreadParticipants.leftAt)))).map(row=>row.id);
  if(!memberIds.includes(membership.id)||memberIds.length<2)
    throw new Error("TEAM_THREAD_NOT_FOUND");
  const active=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"]),
   )).where(and(
    inArray(collegeMemberships.id,memberIds),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"),
   )).for("share");
  if(new Set(active.map(member=>member.id)).size!==memberIds.length)throw new Error("TEAM_PARTICIPANT_INACTIVE");
  const requestedMentions=input.mentionMembershipIds;
  const validMentioned=requestedMentions.length?await tx.select({
    id:collegeMemberships.id,userId:collegeMemberships.userId,
    displayName:users.displayName,
  }).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(
     eq(membershipRoles.membershipId,collegeMemberships.id),
     inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
   .where(and(
    inArray(collegeMemberships.id,requestedMentions),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"),
   )).for("share"):[];
  const mentionNames=new Map(validMentioned.map(row=>[row.id,row.displayName]));
  if(requestedMentions.some(id=>!mentionNames.has(id)))
   throw new Error("TEAM_MENTION_NOT_FOUND");
  const newcomers=requestedMentions.filter(id=>!memberIds.includes(id));
  if(newcomers.length){
   if(thread.kind==="DIRECT"||!thread.isPrivate)
    throw new Error("TEAM_MENTION_NOT_ALLOWED");
   if(!input.addMentionedMembers)
    throw new TeamAddPeopleRequiredError(newcomers.map(id=>
     mentionNames.get(id)?.trim()||"Placement team member"));
  }
  // Repeating the same keyed POST reuses its committed message, even after
  // a client timeout; the thread row lock serializes competing retries.
  const key=input.idempotencyKey?
   "tpo.team.message:"+thread.id+":"+context.user.id+":"+input.idempotencyKey:null;
  const bodyHash=createHash("sha256").update(input.body).digest("hex");
  if(key){
   const [existing]=await tx.select({metadata:activityEvents.metadata})
    .from(activityEvents).where(and(
     eq(activityEvents.dedupeKey,key),
     eq(activityEvents.collegeId,college.id),
     eq(activityEvents.actorUserId,context.user.id),
    )).limit(1);
   if(existing){
    const saved=existing.metadata.messageId;
    if(existing.metadata.bodyHash!==bodyHash||
     Boolean(existing.metadata.markDecision)!==Boolean(input.markDecision)||
     JSON.stringify(existing.metadata.mentionMembershipIds??[])!==
       JSON.stringify(requestedMentions)||typeof saved!=="string")
     throw new Error("TEAM_IDEMPOTENCY_CONFLICT");
    return {id:saved,threadId:thread.id,notified:memberIds.length-1};
   }
  }
  if(newcomers.length){
   // The thread lock serializes two concurrent invite confirmations, and the
   // composite FK keeps all memberships in the same college as this thread.
   await tx.insert(placementTpoInternalThreadParticipants)
    .values(newcomers.map(id=>({
      threadId:thread.id,collegeId:college.id,membershipId:id,leftAt:null,
    })))
    .onConflictDoUpdate({
      target:[placementTpoInternalThreadParticipants.threadId,
        placementTpoInternalThreadParticipants.membershipId],
      set:{leftAt:null,joinedAt:new Date()},
    });
   const fresh=validMentioned.filter(person=>newcomers.includes(person.id));
   active.push(...fresh.map(person=>({id:person.id,userId:person.userId})));
   memberIds.push(...newcomers);
  }
  const [message]=await tx.insert(placementTpoInternalMessages).values({
   threadId:thread.id,collegeId:college.id,
   authorMembershipId:membership.id,body:input.body,
  }).returning({id:placementTpoInternalMessages.id});
  if(!message)throw new Error("TEAM_MESSAGE_FAILED");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.message_sent",
   subjectType:"team_thread",subjectId:thread.id,
   summary:"Private team message created",
   metadata:{messageId:message.id,bodyLength:input.body.length,bodyHash,
    markDecision:Boolean(input.markDecision),mentionMembershipIds:requestedMentions,
    addedMembershipIds:newcomers},
   dedupeKey:key,
  }).returning({id:activityEvents.id});
  if(input.markDecision){
   await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:membership.id,
    module:"PLACEMENTS",eventType:"placements.tpo_team.decision_marked",
    subjectType:"team_thread",subjectId:thread.id,
    summary:"Team marked message as a decision",
    metadata:{messageId:message.id},
   });
  }
  const others=active.filter(member=>member.id!==membership.id);
  if(!event||others.length===0)throw new Error("TEAM_PARTICIPANT_INACTIVE");
  const [actor]=await tx.select({displayName:users.displayName})
   .from(users).where(eq(users.id,context.user.id)).limit(1);
  const actorName=actor?.displayName?.trim()||"TPO colleague";
  await tx.insert(inAppNotifications).values(others.map(other=>({
   eventId:event.id,userId:other.userId,
   title:input.markDecision?"Decision from "+actorName:"New message from "+actorName,
   body:input.body.slice(0,120)+(input.body.length>120?"…":""),
   actionHref:"/tpo/team/"+thread.id+"?m="+message.id,
  })));
  return {id:message.id,threadId:thread.id,notified:others.length};
 });
}
