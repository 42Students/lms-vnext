import "server-only";
import {and,asc,desc,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,membershipRoles,placementCompanyRelationships,placementCompanies,users,
 placementTpoCompanyTeamMessages as messages,placementTpoCompanyTeamFollows as follows} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import {requirePlacementManageScope} from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {prioritizedCompanyTeamRecipients} from "./tpo-company-team-recipient-priority";

export const companyTeamCompanyIdSchema=z.string().uuid();
const uuid=z.string().uuid();
const messageText=z.string().trim().min(1).max(4000);
const mutation=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("SEND"),body:messageText,decision:z.boolean().default(false),
  assigneeId:uuid.nullable().default(null),dueAt:z.iso.datetime({offset:true}).nullable().default(null),
  idempotencyKey:uuid.optional()}),
 z.strictObject({action:z.literal("FOLLOW"),following:z.boolean()}),
 z.strictObject({action:z.literal("EDIT"),messageId:uuid,body:messageText}),
 z.strictObject({action:z.literal("DELETE"),messageId:uuid}),
 z.strictObject({action:z.literal("DECISION"),messageId:uuid,marked:z.boolean()}),
 z.strictObject({action:z.literal("ASK_DONE"),messageId:uuid}),
 z.strictObject({action:z.literal("ASK_CANCEL"),messageId:uuid}),
]);
export class TpoCompanyTeamError extends Error {
 constructor(readonly code:"NOT_FOUND"|"STORAGE_PENDING"|"BAD_ACTION"|"NOT_AUTHORIZED"|"STALE"){
  super(code);this.name="TpoCompanyTeamError";
 }
}
async function companyScope(context:RequestContext,companyId:string,allowArchivedRead=false){
 const membership=context.membership;
 if(!membership||!hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 // Do not trust a still-valid session snapshot after membership/role revocation.
 // All read and write entrypoints reach companyScope before exposing content.
 const activeCollegeId=await requireTpoBatchActor(context);
 const college=await requirePlacementManageScope(context,activeCollegeId);
 const [company]=await getDb().select({id:placementCompanies.id,name:placementCompanies.name,relationshipStatus:placementCompanyRelationships.status})
  .from(placementCompanyRelationships)
  .innerJoin(placementCompanies,and(eq(placementCompanies.id,placementCompanyRelationships.companyId),
    eq(placementCompanies.status,"ACTIVE")))
  .where(and(eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.companyId,companyId),
    ...(allowArchivedRead?[]:[eq(placementCompanyRelationships.status,"ACTIVE")]))).limit(1);
 if(!company)throw new TpoCompanyTeamError("NOT_FOUND");
 return {college,membership,company};
}
async function tablesReady(){
 return (await placementTableExists("placement_tpo_company_team_messages"))&&
  (await placementTableExists("placement_tpo_company_team_follows"));
}
/** TPO-companies-05: only same-college active placement-team members get company discussion. */
export async function readTpoCompanyTeam(context:RequestContext,rawCompanyId:unknown){
 const companyId=companyTeamCompanyIdSchema.parse(rawCompanyId);
 const {college,membership,company}=await companyScope(context,companyId,true);
 if(!await tablesReady())return {status:"NOT_REGISTERED" as const,companyName:company.name,
  messages:[],members:[],following:false,truncated:false,canPost:false};
 const [latest,followers,team]=await Promise.all([
  getDb().select({id:messages.id,body:messages.body,decision:messages.decision,
    askAssigneeMembershipId:messages.askAssigneeMembershipId,askStatus:messages.askStatus,
    askDueAt:messages.askDueAt,authorMembershipId:messages.authorMembershipId,
    authorName:users.displayName,createdAt:messages.createdAt,editedAt:messages.editedAt,
    deletedAt:messages.deletedAt})
   .from(messages).innerJoin(collegeMemberships,and(eq(collegeMemberships.id,messages.authorMembershipId),
     eq(collegeMemberships.collegeId,messages.collegeId)))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(messages.collegeId,college.id),eq(messages.companyId,companyId)))
   .orderBy(desc(messages.createdAt),desc(messages.id)).limit(101),
  getDb().select({membershipId:follows.membershipId}).from(follows)
   .where(and(eq(follows.collegeId,college.id),eq(follows.companyId,companyId),
    eq(follows.membershipId,membership.id))).limit(1),
  getDb().selectDistinct({membershipId:collegeMemberships.id,name:users.displayName})
   .from(collegeMemberships)
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
   .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")))
   .orderBy(asc(users.displayName)).limit(100),
 ]);
 const formatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  dateStyle:"medium",timeStyle:"short"});
 const dayFormatter=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  weekday:"long",day:"numeric",month:"short"});
 const dayKeyFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit"});
 return {status:"READY" as const,companyName:company.name,messages:latest.slice(0,100).reverse()
   .map(row=>({...row,createdLabel:formatter.format(row.createdAt)+" IST",
    dayLabel:dayFormatter.format(row.createdAt),dayKey:dayKeyFormatter.format(row.createdAt),
    askOverdue:row.askStatus==="OPEN"&&Boolean(row.askDueAt&&row.askDueAt.getTime()<Date.now()),
    dueLabel:row.askDueAt?formatter.format(row.askDueAt)+" IST":null})),
  members:team,following:followers.length>0,truncated:latest.length>100,canPost:company.relationshipStatus==="ACTIVE"};
}
export async function mutateTpoCompanyTeam(context:RequestContext,rawCompanyId:unknown,raw:unknown){
 const companyId=companyTeamCompanyIdSchema.parse(rawCompanyId);
 const input=mutation.parse(raw);
 const {college,membership}=await companyScope(context,companyId);
 if(!await tablesReady())throw new TpoCompanyTeamError("STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  const persisted=await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  if(!persisted.membership||persisted.membership.id!==membership.id||
   !hasPlacementTeamMembership(persisted))throw new AuthorizationError("placements.manage");
  const [link]=await tx.select({id:placementCompanyRelationships.id})
    .from(placementCompanyRelationships).where(and(
     eq(placementCompanyRelationships.collegeId,college.id),
     eq(placementCompanyRelationships.companyId,companyId),
     eq(placementCompanyRelationships.status,"ACTIVE"))).for("share").limit(1);
  if(!link)throw new TpoCompanyTeamError("NOT_FOUND");
  if(input.action==="FOLLOW"){
   // A repeated request must be a no-op, not a second activity event.
   // RETURNING reports the row actually created or removed under the unique key.
   const changed=input.following
    ?(await tx.insert(follows).values({collegeId:college.id,
       companyId,membershipId:membership.id}).onConflictDoNothing()
       .returning({membershipId:follows.membershipId})).length>0
    :(await tx.delete(follows).where(and(eq(follows.collegeId,college.id),
       eq(follows.companyId,companyId),eq(follows.membershipId,membership.id)))
       .returning({membershipId:follows.membershipId})).length>0;
   if(changed)await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:membership.id,module:"PLACEMENTS",
    eventType:"placements.tpo_company_team.follow_changed",
    subjectType:"company",subjectId:companyId,
    summary:input.following?"Started following company team updates":"Stopped following company team updates",
    metadata:{following:input.following},
   });
   return {changed};
  }
  if(input.action==="SEND"){
   if(input.dueAt&&(!input.assigneeId||Date.parse(input.dueAt)<=Date.now()))
    throw new TpoCompanyTeamError("BAD_ACTION");
   if(input.assigneeId===membership.id)throw new TpoCompanyTeamError("BAD_ACTION");
   if(input.assigneeId){
    const [assignee]=await tx.select({id:collegeMemberships.id})
     .from(collegeMemberships).innerJoin(users,and(eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE")))
     .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
     .where(and(eq(collegeMemberships.id,input.assigneeId),eq(collegeMemberships.collegeId,college.id),
      eq(collegeMemberships.status,"ACTIVE"))).limit(1);
    if(!assignee)throw new TpoCompanyTeamError("NOT_AUTHORIZED");
   }
   // The client reuses its UUID when a network response is lost. A unique
   // college/company/author/key constraint serializes concurrent retries, and
   // replays do not emit a second activity event or recipient notification.
   const [message]=await tx.insert(messages).values({
    collegeId:college.id,companyId,authorMembershipId:membership.id,body:input.body,
    idempotencyKey:input.idempotencyKey??null,
    decision:input.decision,askAssigneeMembershipId:input.assigneeId,
    askDueAt:input.dueAt?new Date(input.dueAt):null,
    askStatus:input.assigneeId?"OPEN":null,
   }).onConflictDoNothing().returning({id:messages.id});
   if(!message){
    if(!input.idempotencyKey)throw new TpoCompanyTeamError("STALE");
    const [original]=await tx.select({
      id:messages.id,body:messages.body,decision:messages.decision,
      assignee:messages.askAssigneeMembershipId,dueAt:messages.askDueAt,
    }).from(messages).where(and(
      eq(messages.collegeId,college.id),eq(messages.companyId,companyId),
      eq(messages.authorMembershipId,membership.id),
      eq(messages.idempotencyKey,input.idempotencyKey),
    )).limit(1);
    if(!original||original.body!==input.body||original.decision!==input.decision||
      original.assignee!==input.assigneeId||
      (original.dueAt?.getTime()??null)!==(input.dueAt?Date.parse(input.dueAt):null))
      throw new TpoCompanyTeamError("STALE");
    return {changed:false,id:original.id};
   }
   // Bell notifications stay inside the same transaction, to verified active
   // college placement team members only. Followers, @team and assignee are
   // deduplicated; arbitrary @name text never grants notification access.
   const [event]=await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:membership.id,
    module:"PLACEMENTS",eventType:"placements.tpo_company_team.message_sent",
    subjectType:"company",subjectId:companyId,
    summary:"Private company placement team message",
    metadata:{messageId:message.id,hasAsk:Boolean(input.assigneeId),
      decision:input.decision,bodyLength:input.body.length},
   }).returning({id:activityEvents.id});
   const subscribers=await tx.select({membershipId:follows.membershipId})
     .from(follows).where(and(eq(follows.collegeId,college.id),eq(follows.companyId,companyId)))
     .orderBy(asc(follows.membershipId)).limit(250);
   const explicitMentions:string[]=[];
   // Explicit @member:<UUID> is an unambiguous, scoped person mention.
   // Recipient membership and college status are still verified below.
   for(const match of input.body.matchAll(/@member:([0-9a-f-]{36})/gi)){
    const id=match[1];
    if(id&&uuid.safeParse(id).success)explicitMentions.push(id);
   }
   const teammates:string[]=[];
   if(/(?:^|\s)@team(?:\b|$)/i.test(input.body)){
    const colleagues=await tx.selectDistinct({id:collegeMemberships.id}).from(collegeMemberships)
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
       inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
      .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")))
      .orderBy(asc(collegeMemberships.id)).limit(250);
    teammates.push(...colleagues.map(row=>row.id));
   }
   const notifyIds=prioritizedCompanyTeamRecipients({
    actorMembershipId:membership.id,assigneeId:input.assigneeId,
    mentions:explicitMentions,team:teammates,
    followers:subscribers.map(row=>row.membershipId),
   });
   if(event&&notifyIds.length>0){
    const targets=await tx.selectDistinct({id:collegeMemberships.id,userId:users.id})
      .from(collegeMemberships)
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
      .where(and(eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE"),
        inArray(collegeMemberships.id,notifyIds)))
      .limit(250);
    if(targets.length)await tx.insert(inAppNotifications).values(targets.map(member=>({
      eventId:event.id,userId:member.userId,
      title:input.assigneeId===member.id?"A teammate asked you":"Company Team update",
      body:input.body.slice(0,120),
      actionHref:"/tpo/companies/"+companyId+"/team#team-message-"+message.id,
    })));
   }
   if(!message)throw new TpoCompanyTeamError("STALE");
   return {changed:true,id:message.id};
  }
  const [message]=await tx.select().from(messages).where(and(
    eq(messages.id,input.messageId),eq(messages.collegeId,college.id),
    eq(messages.companyId,companyId))).for("update").limit(1);
  if(!message||message.deletedAt)throw new TpoCompanyTeamError("NOT_FOUND");
  if(input.action==="EDIT"){
   if(message.authorMembershipId!==membership.id)throw new TpoCompanyTeamError("NOT_AUTHORIZED");
   if(Date.now()-message.createdAt.getTime()>15*60*1000)throw new TpoCompanyTeamError("STALE");
   await tx.update(messages).set({body:input.body,editedAt:new Date()}).where(eq(messages.id,message.id));
  }else if(input.action==="DELETE"){
   if(message.authorMembershipId!==membership.id)throw new TpoCompanyTeamError("NOT_AUTHORIZED");
   await tx.update(messages).set({body:"Message removed",deletedAt:new Date(),decision:false,
    askStatus:message.askStatus==="OPEN"?"CANCELLED":message.askStatus}).where(eq(messages.id,message.id));
  }else if(input.action==="DECISION"){
   await tx.update(messages).set({decision:input.marked}).where(eq(messages.id,message.id));
  }else if(input.action==="ASK_DONE"||input.action==="ASK_CANCEL"){
   if(message.askStatus!=="OPEN")throw new TpoCompanyTeamError("STALE");
   if(input.action==="ASK_DONE"&&message.askAssigneeMembershipId!==membership.id)
    throw new TpoCompanyTeamError("NOT_AUTHORIZED");
   if(input.action==="ASK_CANCEL"&&message.authorMembershipId!==membership.id)
    throw new TpoCompanyTeamError("NOT_AUTHORIZED");
   await tx.update(messages).set({askStatus:input.action==="ASK_DONE"?"DONE":"CANCELLED"})
    .where(eq(messages.id,message.id));
  }
  const verb=input.action==="ASK_DONE"?"ask_done":
    input.action==="ASK_CANCEL"?"ask_cancelled":
    input.action==="DECISION"?"decision_changed":
    input.action==="DELETE"?"message_deleted":"message_edited";
  const [event]=await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:membership.id,module:"PLACEMENTS",
    eventType:"placements.tpo_company_team."+verb,
    subjectType:"company",subjectId:companyId,
    summary:"Company Team "+verb.replaceAll("_"," "),
    metadata:{messageId:message.id},
  }).returning({id:activityEvents.id});
  if(event&&(input.action==="ASK_DONE"||input.action==="ASK_CANCEL")){
    const targetMembershipId=input.action==="ASK_DONE"?message.authorMembershipId:
      message.askAssigneeMembershipId;
    if(targetMembershipId&&targetMembershipId!==membership.id){
      const [recipient]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
       .from(collegeMemberships)
       .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
        eq(users.platformStatus,"ACTIVE")))
       .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
       .where(and(eq(collegeMemberships.id,targetMembershipId),eq(collegeMemberships.collegeId,college.id),
        eq(collegeMemberships.status,"ACTIVE"))).limit(1);
      if(recipient)await tx.insert(inAppNotifications).values({
       userId:recipient.userId,eventId:event.id,
       title:input.action==="ASK_DONE"?"Company Team ask completed":"Company Team ask cancelled",
       body:message.body.slice(0,120),
       actionHref:"/tpo/companies/"+companyId+"/team#team-message-"+message.id,
      });
    }
  }
  return {changed:true,id:message.id};
 });
}
