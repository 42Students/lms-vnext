import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,learnerProgramEnrollments,membershipRoles,
 placementBatchRegistrationEvents,placementBatchRegistrations,placementExternalOfferEvents,placementExternalOffers,
 placementLearnerGeneralRequestEvents,placementLearnerGeneralRequests,placementOffers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoGeneralRequestInputSchema,tpoGeneralRequestDecisionSchema,tpoGeneralRequestTarget,
 tpoGeneralRequestPayload} from "./tpo-general-request-model";
export class TpoGeneralRequestError extends Error{
 constructor(readonly code:"UNAVAILABLE"|"SCOPE"|"STALE"|"EFFECT_UNSUPPORTED"|"TARGET_CHANGED"){
  super(code);
 }
}
const UUID="placement_learner_general_requests";
const sqlUuid=z.string().uuid();
async function requireRegistered(){
 if(!(await placementTableExists(UUID)))throw new TpoGeneralRequestError("UNAVAILABLE");
}
async function requireLearner(ctx:RequestContext){
 const member=ctx.membership;
 if(!member||!hasMembershipRole(ctx,"LEARNER")||member.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.read");
 const [row]=await getDb().select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,member.id),eq(collegeMemberships.collegeId,member.collegeId),
   eq(collegeMemberships.userId,ctx.user.id),eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!row)throw new AuthorizationError("placements.read");
 return member;
}
async function requireTpo(ctx:RequestContext){
 const member=ctx.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(ctx,"TPO")||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 if(!can(ctx,"placements.manage",{collegeId:member.collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(ctx,"placements.manage",{collegeId:member.collegeId});
 return requirePlacementManageScope(ctx,member.collegeId);
}
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function lockCollege(tx:Tx,collegeId:string){
 const [row]=await tx.select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges)
  .where(eq(colleges.id,collegeId)).for("update").limit(1);
 if(!row)throw new TpoGeneralRequestError("SCOPE");
 return row;
}
async function verifyLearnerTx(tx:Tx,collegeId:string,id:string){
 const [row]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!row)throw new TpoGeneralRequestError("SCOPE");
 return row;
}
async function notifyTpo(tx:Tx,collegeId:string,eventId:string){
 const staff=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")));
 if(staff.length)await tx.insert(inAppNotifications).values(staff.map(row=>({
  userId:row.userId,eventId,title:"New student request",body:"A student needs your decision.",
  actionHref:"/tpo/requests",
 }))).onConflictDoNothing();
}
export async function createOwnTpoGeneralRequest(ctx:RequestContext,raw:unknown){
 const member=await requireLearner(ctx),input=tpoGeneralRequestInputSchema.parse(raw);
 await requireRegistered();
 return getDb().transaction(async tx=>{
  const college=await lockCollege(tx,member.collegeId);
  await verifyLearnerTx(tx,member.collegeId,member.id);
  if(input.kind==="OFFER_ACCEPTANCE_DISPUTE"){
   const [offer]=await tx.select({
    id:placementOffers.id,
    status:placementOffers.status,
    acceptanceChannel:placementOffers.acceptanceChannel,
    acceptedDisputableUntil:placementOffers.acceptedDisputableUntil,
   }).from(placementOffers).where(and(
    eq(placementOffers.id,input.offerId),
    eq(placementOffers.membershipId,member.id),
    eq(placementOffers.collegeId,member.collegeId),
   )).for("update").limit(1);
   if(!offer||offer.status!=="ACCEPTED"||offer.acceptanceChannel!=="EXTERNAL_IMPORT"||
     !offer.acceptedDisputableUntil||offer.acceptedDisputableUntil.getTime()<=Date.now())
      throw new TpoGeneralRequestError("TARGET_CHANGED");
  }
  if(input.kind==="REGISTRATION_CHANGE"){
   const rows=await tx.select({cohortId:learnerProgramEnrollments.cohortId})
    .from(learnerProgramEnrollments).where(and(eq(learnerProgramEnrollments.membershipId,member.id),
     eq(learnerProgramEnrollments.cohortId,input.cohortId),
     eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(1);
   if(rows.length!==1)throw new TpoGeneralRequestError("SCOPE");
   if(input.choice==="PLACEMENTS"&&input.consentConfirmed!==true)
    throw new TpoGeneralRequestError("TARGET_CHANGED");
  }
  const scope=tpoGeneralRequestTarget(input);
  const [existing]=await tx.select({id:placementLearnerGeneralRequests.id})
   .from(placementLearnerGeneralRequests).where(and(
    eq(placementLearnerGeneralRequests.collegeId,member.collegeId),
    eq(placementLearnerGeneralRequests.membershipId,member.id),
    eq(placementLearnerGeneralRequests.kind,input.kind),
    eq(placementLearnerGeneralRequests.targetKey,scope),
    eq(placementLearnerGeneralRequests.status,"PENDING"))).limit(1);
  if(existing)return {id:existing.id,replayed:true};
  const [request]=await tx.insert(placementLearnerGeneralRequests).values({
   collegeId:member.collegeId,membershipId:member.id,kind:input.kind,
   targetKey:scope,reason:input.reason,payload:tpoGeneralRequestPayload(input),
   requestedByUserId:ctx.user.id,
  }).onConflictDoNothing().returning({id:placementLearnerGeneralRequests.id});
  if(!request)throw new TpoGeneralRequestError("TARGET_CHANGED");
  await tx.insert(placementLearnerGeneralRequestEvents).values({
   requestId:request.id,priorStatus:null,nextStatus:"PENDING",actorUserId:ctx.user.id,
  });
  const [event]=await tx.insert(activityEvents).values({
   collegeId:college.id,organizationId:college.organizationId,actorUserId:ctx.user.id,
   actorMembershipId:member.id,module:"PLACEMENTS",eventType:"PLACEMENTS_GENERAL_REQUEST_SUBMITTED",
   subjectType:"placement_general_request",subjectId:request.id,
   summary:"Student submitted a "+input.kind.toLowerCase().replaceAll("_"," ")+" request",
   metadata:{kind:input.kind},
  }).returning({id:activityEvents.id});
  if(!event)throw new TpoGeneralRequestError("TARGET_CHANGED");
  await notifyTpo(tx,college.id,event.id);
  return {id:request.id,replayed:false};
 });
}
export async function listOwnTpoGeneralRequests(ctx:RequestContext){
 const member=await requireLearner(ctx);
 await requireRegistered();
 return getDb().select({
  id:placementLearnerGeneralRequests.id,kind:placementLearnerGeneralRequests.kind,
  status:placementLearnerGeneralRequests.status,reason:placementLearnerGeneralRequests.reason,
  decidedAt:placementLearnerGeneralRequests.decidedAt,decisionNote:placementLearnerGeneralRequests.decisionNote,
  requestedAt:placementLearnerGeneralRequests.requestedAt,
 }).from(placementLearnerGeneralRequests).where(and(eq(placementLearnerGeneralRequests.collegeId,member.collegeId),
  eq(placementLearnerGeneralRequests.membershipId,member.id)))
  .orderBy(desc(placementLearnerGeneralRequests.requestedAt)).limit(100);
}
export async function listTpoGeneralRequests(ctx:RequestContext){
 const college=await requireTpo(ctx);
 await requireRegistered();
 return getDb().select({
  id:placementLearnerGeneralRequests.id,kind:placementLearnerGeneralRequests.kind,
  status:placementLearnerGeneralRequests.status,reason:placementLearnerGeneralRequests.reason,
  payload:placementLearnerGeneralRequests.payload,version:placementLearnerGeneralRequests.version,
  membershipId:placementLearnerGeneralRequests.membershipId,
  studentName:users.displayName,requestedAt:placementLearnerGeneralRequests.requestedAt,
  decidedAt:placementLearnerGeneralRequests.decidedAt,decisionNote:placementLearnerGeneralRequests.decisionNote,
 }).from(placementLearnerGeneralRequests)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementLearnerGeneralRequests.membershipId),
   eq(collegeMemberships.collegeId,college.id)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(eq(placementLearnerGeneralRequests.collegeId,college.id))
  .orderBy(sql`case when ${placementLearnerGeneralRequests.status}='PENDING' then 0 else 1 end`,
   placementLearnerGeneralRequests.requestedAt,placementLearnerGeneralRequests.id).limit(1000);
}
/** Unsupported effects never silently approve a pending dispute/correction.
 * Every valid approval must write its real domain consequence in the same transaction. */
async function approveEffect(tx:Tx,ctx:RequestContext,row:typeof placementLearnerGeneralRequests.$inferSelect){
 const p=row.payload;
 if(row.kind==="OFF_CAMPUS_OFFER"){
  const company=String(p.companyName??""),compensation=String(p.ctcLpa??"");
  if(!company||!compensation)throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [offer]=await tx.insert(placementExternalOffers).values({
   collegeId:row.collegeId,membershipId:row.membershipId,
   companyName:company,ctcLpa:compensation,submittedByUserId:row.requestedByUserId,
   status:"VERIFIED",reviewedByUserId:ctx.user.id,reviewedAt:new Date(),
  }).returning({id:placementExternalOffers.id});
  await tx.insert(placementExternalOfferEvents).values({
   offerId:offer.id,priorStatus:null,nextStatus:"VERIFIED",actorUserId:ctx.user.id,
  });
  return {effect:"VERIFIED_EXTERNAL_OFFER",id:offer.id};
 }
 if(row.kind==="REGISTRATION_CHANGE"){
  const cohortId=String(p.cohortId??""),choice=String(p.choice??"");
  if(!["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].includes(choice))
   throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [enrollment]=await tx.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .where(and(eq(learnerProgramEnrollments.membershipId,row.membershipId),
    eq(learnerProgramEnrollments.cohortId,cohortId),
    eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(1);
  if(!enrollment||choice==="PLACEMENTS"&&p.consentConfirmed!==true)
   throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [existing]=await tx.select().from(placementBatchRegistrations).where(and(
   eq(placementBatchRegistrations.membershipId,row.membershipId),
   eq(placementBatchRegistrations.cohortId,cohortId),
   eq(placementBatchRegistrations.collegeId,row.collegeId))).for("update").limit(1);
  const now=new Date(),consent=choice==="PLACEMENTS";
  const [saved]=await tx.insert(placementBatchRegistrations).values({
   collegeId:row.collegeId,membershipId:row.membershipId,cohortId,choice,
   source:"TPO",recordedByUserId:ctx.user.id,
   consentVersion:consent?"TPO-REQUEST-01":null,consentAt:consent?now:null,
  }).onConflictDoUpdate({target:[placementBatchRegistrations.membershipId,placementBatchRegistrations.cohortId],
   set:{choice,source:"TPO",recordedByUserId:ctx.user.id,
    consentVersion:consent?"TPO-REQUEST-01":null,consentAt:consent?now:null,
    version:(existing?.version??0)+1,updatedAt:now}}).returning({id:placementBatchRegistrations.id});
  await tx.insert(placementBatchRegistrationEvents).values({
   registrationId:saved.id,previousChoice:existing?.choice??null,nextChoice:choice,
   consentVersion:consent?"TPO-REQUEST-01":null,consentAt:consent?now:null,
   actorUserId:ctx.user.id,source:"TPO",
  });
  return {effect:"REGISTRATION_UPDATED",id:saved.id};
 }
 throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED");
}
export async function decideTpoGeneralRequest(ctx:RequestContext,rawId:unknown,raw:unknown){
 const college=await requireTpo(ctx);
 const id=sqlUuid.parse(rawId),decision=tpoGeneralRequestDecisionSchema.parse(raw);
 await requireRegistered();
 return getDb().transaction(async tx=>{
  await lockCollege(tx,college.id);
  const [row]=await tx.select().from(placementLearnerGeneralRequests).where(and(
   eq(placementLearnerGeneralRequests.id,id),eq(placementLearnerGeneralRequests.collegeId,college.id),
  )).for("update").limit(1);
  if(!row||row.status!=="PENDING"||row.version!==decision.version)
   throw new TpoGeneralRequestError("STALE");
  await verifyLearnerTx(tx,college.id,row.membershipId);
  const effect=decision.action==="APPROVE"?await approveEffect(tx,ctx,row):null;
  const now=new Date(),nextStatus=decision.action==="APPROVE"?"APPROVED":"REJECTED";
  if(nextStatus==="REJECTED"&&decision.note.trim().length<3)throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [saved]=await tx.update(placementLearnerGeneralRequests).set({
   status:nextStatus,decidedByUserId:ctx.user.id,decidedAt:now,
   decisionNote:decision.note,version:randomUUID(),updatedAt:now,
  }).where(and(eq(placementLearnerGeneralRequests.id,row.id),
   eq(placementLearnerGeneralRequests.status,"PENDING"),
   eq(placementLearnerGeneralRequests.version,decision.version)))
  .returning({id:placementLearnerGeneralRequests.id});
  if(!saved)throw new TpoGeneralRequestError("STALE");
  await tx.insert(placementLearnerGeneralRequestEvents).values({
   requestId:row.id,priorStatus:"PENDING",nextStatus,actorUserId:ctx.user.id,note:decision.note,
  });
  const [event]=await tx.insert(activityEvents).values({
   collegeId:college.id,organizationId:college.organizationId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_GENERAL_REQUEST_DECIDED",
   subjectType:"placement_general_request",subjectId:row.id,
   summary:"TPO "+decision.action.toLowerCase()+" "+row.kind.toLowerCase().replaceAll("_"," ")+" request",
   metadata:{kind:row.kind,status:nextStatus,effect:effect?.effect??null},
  }).returning({id:activityEvents.id});
  const [member]=await tx.select({userId:collegeMemberships.userId}).from(collegeMemberships)
   .where(and(eq(collegeMemberships.id,row.membershipId),eq(collegeMemberships.collegeId,college.id))).limit(1);
  if(!member||!event)throw new TpoGeneralRequestError("SCOPE");
  await tx.insert(inAppNotifications).values({
   userId:member.userId,eventId:event.id,
   title:nextStatus==="APPROVED"?"Placement request approved":"Placement request declined",
   body:decision.note||"The placement cell reviewed your request.",
   actionHref:"/learn/my-placements",
  }).onConflictDoNothing();
  return {id:row.id,status:nextStatus,effect};
 });
}
