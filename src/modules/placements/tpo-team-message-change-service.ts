import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {createHash} from "node:crypto";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages,placementTpoInternalThreadParticipants} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoTeamCanEdit} from "./tpo-team-message-change-model";

const base=z.strictObject({
 threadId:z.string().uuid(),
 messageId:z.string().uuid(),
 expectedBodyHash:z.string().regex(/^[a-f0-9]{64}$/),
});
export const tpoTeamMessageChangeSchema=z.discriminatedUnion("action",[
 base.extend({action:z.literal("EDIT"),body:z.string().trim().min(1).max(4000),addPeople:z.array(z.uuid()).max(20).optional()}),
 base.extend({action:z.literal("DELETE")}),
]);
export function tpoTeamMessageBodyHash(body:string){
 return createHash("sha256").update(body).digest("hex");
}
/** No GET mutations; authorization, optimistic body and edit time checked under row locks. */
export async function changeTpoTeamMessage(context:RequestContext,raw:unknown){
 const input=tpoTeamMessageChangeSchema.parse(raw);
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_messages"))throw new Error("TEAM_TABLES_PENDING");
 const adding=input.action==="EDIT"?(input.addPeople??[]):[];
 const groupReady=adding.length>0&&await placementTableExists("placement_tpo_internal_thread_participants");
 if(adding.length>0&&!groupReady)throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({
   id:placementTpoInternalThreads.id,
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
   kind:placementTpoInternalThreads.kind,
  })
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,membership.id),
       eq(placementTpoInternalThreads.invitedMembershipId,membership.id)),
   )).limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  const [message]=await tx.select({
   id:placementTpoInternalMessages.id,body:placementTpoInternalMessages.body,
   createdAt:placementTpoInternalMessages.createdAt,
  }).from(placementTpoInternalMessages).where(and(
   eq(placementTpoInternalMessages.id,input.messageId),
   eq(placementTpoInternalMessages.threadId,thread.id),
   eq(placementTpoInternalMessages.collegeId,college.id),
   eq(placementTpoInternalMessages.authorMembershipId,membership.id),
  )).for("update").limit(1);
  if(!message)throw new Error("TEAM_MESSAGE_NOT_FOUND");
  if(tpoTeamMessageBodyHash(message.body)!==input.expectedBodyHash)
   throw new Error("TEAM_STALE_MESSAGE");
  const [removed]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,college.id),
    eq(activityEvents.subjectId,thread.id),
    eq(activityEvents.eventType,"placements.tpo_team.message_deleted"),
    sql`${activityEvents.metadata}->>'messageId' = ${message.id}`,
   )).limit(1);
  if(removed)throw new Error("TEAM_MESSAGE_REMOVED");
  const now=new Date();
  if(input.action==="EDIT"&&!tpoTeamCanEdit(message.createdAt,now))
   throw new Error("TEAM_EDIT_WINDOW_EXPIRED");
  let newlyInvited:{id:string;userId:string}[]=[];
  // Legacy edit(addPeople) is a separate security decision from changing a
  // message. Prove every selected colleague is an active TPO/admin in the
  // same college before widening this thread. Keep all changes atomic.
  if(adding.length>0){
   const distinct=[...new Set(adding)];
   const known=new Set([thread.startedByMembershipId,thread.invitedMembershipId]);
   if(distinct.length!==adding.length||distinct.includes(membership.id))
    throw new Error("TEAM_RECIPIENT_NOT_FOUND");
   const candidateIds=distinct.filter(id=>!known.has(id));
   if(candidateIds.length){
    const teammates=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
     .from(collegeMemberships)
     .innerJoin(users,eq(users.id,collegeMemberships.userId))
     .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
     .where(and(inArray(collegeMemberships.id,candidateIds),
      eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
     .for("share");
    const byId=new Map(teammates.map(row=>[row.id,row]));
    if(candidateIds.some(id=>!byId.has(id)))throw new Error("TEAM_RECIPIENT_NOT_FOUND");
    if(thread.kind==="DIRECT"){
     await tx.update(placementTpoInternalThreads).set({kind:"TOPIC"})
      .where(and(eq(placementTpoInternalThreads.id,thread.id),
       eq(placementTpoInternalThreads.collegeId,college.id)));
     await tx.insert(placementTpoInternalThreadParticipants).values(
      [thread.startedByMembershipId,thread.invitedMembershipId].map(membershipId=>({
       collegeId:college.id,threadId:thread.id,membershipId,
      }))).onConflictDoNothing();
    }
    const existing=await tx.select({
     membershipId:placementTpoInternalThreadParticipants.membershipId,
     leftAt:placementTpoInternalThreadParticipants.leftAt,
    }).from(placementTpoInternalThreadParticipants).where(and(
     eq(placementTpoInternalThreadParticipants.threadId,thread.id),
     eq(placementTpoInternalThreadParticipants.collegeId,college.id),
     inArray(placementTpoInternalThreadParticipants.membershipId,candidateIds)));
    if(existing.some(row=>row.leftAt!==null))
     throw new Error("TEAM_THREAD_MEMBERSHIP_INACTIVE");
    const enrolled=new Set(existing.map(row=>row.membershipId));
    const addIds=candidateIds.filter(id=>!enrolled.has(id));
    if(addIds.length)await tx.insert(placementTpoInternalThreadParticipants).values(
     addIds.map(membershipId=>({collegeId:college.id,threadId:thread.id,membershipId})));
    newlyInvited=addIds.map(id=>byId.get(id)!);
   }
  }
  const updatedBody=input.action==="EDIT"?input.body:"Message removed";
  const [updated]=await tx.update(placementTpoInternalMessages)
   .set({body:updatedBody}).where(and(
    eq(placementTpoInternalMessages.id,message.id),
    eq(placementTpoInternalMessages.threadId,thread.id),
    eq(placementTpoInternalMessages.collegeId,college.id),
    eq(placementTpoInternalMessages.authorMembershipId,membership.id),
    eq(placementTpoInternalMessages.body,message.body),
   )).returning({id:placementTpoInternalMessages.id});
  if(!updated)throw new Error("TEAM_STALE_MESSAGE");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",
   eventType:input.action==="EDIT"?"placements.tpo_team.message_edited":
    "placements.tpo_team.message_deleted",
   subjectType:"team_thread",subjectId:thread.id,
   summary:input.action==="EDIT"?"TPO team message edited":"TPO team message removed",
   metadata:{messageId:message.id,addedMembershipIds:newlyInvited.map(item=>item.id)},
  }).returning({id:activityEvents.id});
  // Keep the recipient informed about edits/removals without exposing a
  // departed teammate's history. Never email or claim delivery to nonmembers.
  const otherId=thread.startedByMembershipId===membership.id?
   thread.invitedMembershipId:thread.startedByMembershipId;
  const [recipient]=await tx.select({userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
   .where(and(eq(collegeMemberships.id,otherId),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(event&&recipient){
   const [actor]=await tx.select({name:users.displayName}).from(users)
    .where(eq(users.id,context.user.id)).limit(1);
   const who=actor?.name?.trim()||"A teammate";
   await tx.insert(inAppNotifications).values({
    eventId:event.id,userId:recipient.userId,
    title:who+(input.action==="EDIT"?" edited a Team message":" removed a Team message"),
    body:input.action==="EDIT"?"A Team message has been updated.":"Message removed",
    actionHref:"/tpo/team/"+thread.id+"?m="+message.id,
   }).onConflictDoNothing();
  }
  if(event&&newlyInvited.length){
   await tx.insert(inAppNotifications).values(newlyInvited.map(person=>({
    eventId:event.id,userId:person.userId,
    title:"Added to placement team conversation",
    body:"A placement team member invited you to join a private conversation.",
    actionHref:"/tpo/team/"+thread.id+"?m="+message.id,
   }))).onConflictDoNothing();
  }
  return {id:message.id,action:input.action,
   addedPeople:newlyInvited.map(item=>item.id)};
 });
}
