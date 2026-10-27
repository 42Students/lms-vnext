import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,learnerProgramEnrollments,membershipRoles,
 placementBatchRegistrationEvents,placementBatchRegistrations,placementExternalOfferEvents,placementExternalOffers,
 placementLearnerGeneralRequestEvents,placementLearnerGeneralRequests,placementApplications,placementJobRounds,placementJobs,placementOffers,placementRoundAttendance,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {requirePersistedTpoMembership} from "./tpo-persisted-actor-service";
import {requireTpoJobActor} from "./tpo-job-write-base";
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
/** 0134 first IF NOT EXISTS definition has a five-kind CHECK. The sixth kind
 * cannot be written until its additive migration has actually been registered. */
async function requireRegisteredKind(tx:Tx,kind:string){
 if(kind!=="OFFER_ACCEPTANCE_DISPUTE")return;
 const result=await tx.execute(sql`select exists(
  select 1 from pg_constraint where conrelid=to_regclass('public.placement_learner_general_requests')
   and conname='placement_general_request_kind_ck' and contype='c'
   and pg_get_constraintdef(oid) like '%OFFER_ACCEPTANCE_DISPUTE%'
 ) as enabled`);
 if(result.rows[0]?.["enabled"]!==true)throw new TpoGeneralRequestError("UNAVAILABLE");
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
 // A session role may remain cached after the college revokes a TPO account.
 // Revalidate the live actor before any private request list or review.
 await requirePersistedTpoMembership(ctx,member.collegeId);
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
async function notifyTpo(tx:Tx,collegeId:string,eventId:string,kind:string){
 const staff=await tx.selectDistinct({userId:collegeMemberships.userId}).from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")));
 if(staff.length)await tx.insert(inAppNotifications).values(staff.map(row=>({
  userId:row.userId,eventId,title:"New "+kind.toLowerCase().replaceAll("_"," ")+" request to TPO",body:"A student needs your decision.",
  actionHref:"/tpo/requests",
 }))).onConflictDoNothing();
}
export async function createOwnTpoGeneralRequest(ctx:RequestContext,raw:unknown){
 const member=await requireLearner(ctx),input=tpoGeneralRequestInputSchema.parse(raw);
 await requireRegistered();
 return getDb().transaction(async tx=>{
  const college=await lockCollege(tx,member.collegeId);
  await verifyLearnerTx(tx,member.collegeId,member.id);
   await requireRegisteredKind(tx,input.kind);
  if(input.kind==="OFFER_ACCEPTANCE_DISPUTE"){
   const [offer]=await tx.select({
    id:placementOffers.id,
    status:placementOffers.status,
    acceptanceChannel:placementOffers.acceptanceChannel,
    acceptedDisputableUntil:placementOffers.acceptedDisputableUntil,
   }).from(placementOffers).innerJoin(placementApplications,
     eq(placementApplications.id,placementOffers.applicationId)).where(and(
    eq(placementOffers.id,input.offerId),
    eq(placementApplications.membershipId,member.id),
   )).for("update").limit(1);
   if(!offer||offer.status!=="ACCEPTED"||offer.acceptanceChannel!=="EXTERNAL_IMPORT"||
     !offer.acceptedDisputableUntil||offer.acceptedDisputableUntil.getTime()<=Date.now())
      throw new TpoGeneralRequestError("TARGET_CHANGED");
  }
  if(input.kind==="ABSENCE_DISPUTE"){
   // An arbitrary application/round pair must never be accepted as a tenant
   // request. Validate the actual application owner and round's job together.
   const [participation]=await tx.select({id:placementApplications.id})
    .from(placementApplications)
    .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .innerJoin(placementJobRounds,and(
      eq(placementJobRounds.id,input.roundId),
      eq(placementJobRounds.jobId,placementJobs.id)))
    .where(and(eq(placementApplications.id,input.applicationId),
      eq(placementApplications.membershipId,member.id),
      eq(placementJobs.collegeId,member.collegeId))).limit(1);
   if(!participation)throw new TpoGeneralRequestError("SCOPE");
  }
  if(input.kind==="PLACEMENT_AFTER_PLACEMENT"){
   // Job IDs are not proof of eligibility; refuse cross-college/nonexistent
   // targets before a request can enter a placement cell's decision queue.
   const [requestedJob]=await tx.select({id:placementJobs.id})
    .from(placementJobs).where(and(
      eq(placementJobs.id,input.requestedJobId),
      eq(placementJobs.collegeId,member.collegeId))).limit(1);
   if(!requestedJob)throw new TpoGeneralRequestError("SCOPE");
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
  const payload=tpoGeneralRequestPayload(input);
  const [existing]=await tx.select({id:placementLearnerGeneralRequests.id,
   reason:placementLearnerGeneralRequests.reason,
   payloadMatches:sql<boolean>`${placementLearnerGeneralRequests.payload} = ${JSON.stringify(payload)}::jsonb`})
   .from(placementLearnerGeneralRequests).where(and(
    eq(placementLearnerGeneralRequests.collegeId,member.collegeId),
    eq(placementLearnerGeneralRequests.membershipId,member.id),
    eq(placementLearnerGeneralRequests.kind,input.kind),
    eq(placementLearnerGeneralRequests.targetKey,scope),
    eq(placementLearnerGeneralRequests.status,"PENDING"))).limit(1);
  if(existing){
   if(existing.reason!==input.reason||!existing.payloadMatches)
    throw new TpoGeneralRequestError("TARGET_CHANGED");
   return {id:existing.id,replayed:true,
    message:"You already sent this request. The placement cell will answer it."};
  }
  const [request]=await tx.insert(placementLearnerGeneralRequests).values({
   collegeId:member.collegeId,membershipId:member.id,kind:input.kind,
   targetKey:scope,reason:input.reason,payload,
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
  await notifyTpo(tx,college.id,event.id,input.kind);
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
  .orderBy(desc(placementLearnerGeneralRequests.requestedAt),desc(placementLearnerGeneralRequests.id)).limit(100);
}
/** Bounded college-scoped general-request review. The former 1000-row
 * list could silently hide a busy college's outstanding requests. */
export const tpoGeneralReviewQuerySchema=z.strictObject({
 page:z.coerce.number().int().min(1).max(10000).default(1),
 pageSize:z.coerce.number().int().min(10).max(50).default(25),
 status:z.enum(["ALL","PENDING","APPROVED","REJECTED","CANCELLED"]).default("PENDING"),
});
export async function listTpoGeneralRequests(ctx:RequestContext,raw:unknown={}){
 const college=await requireTpo(ctx);
 await requireRegistered();
 const filter=tpoGeneralReviewQuerySchema.parse(raw);
 const scoped=and(eq(placementLearnerGeneralRequests.collegeId,college.id),
   filter.status==="ALL"?undefined:eq(placementLearnerGeneralRequests.status,filter.status));
 const [totalRows,requests]=await Promise.all([
  getDb().select({count:sql<number>`count(*)::int`}).from(placementLearnerGeneralRequests).where(scoped),
  getDb().select({
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
   .where(scoped)
   .orderBy(sql`case when ${placementLearnerGeneralRequests.status}='PENDING' then 0 else 1 end`,
    placementLearnerGeneralRequests.requestedAt,placementLearnerGeneralRequests.id)
   .limit(filter.pageSize).offset((filter.page-1)*filter.pageSize),
 ]);
 const total=Number(totalRows[0]?.count??0);
 return {requests,total,page:filter.page,pageSize:filter.pageSize,
  totalPages:Math.max(1,Math.ceil(total/filter.pageSize)),status:filter.status};
}
/** Unsupported effects never silently approve a pending dispute/correction.
 * Every valid approval must write its real domain consequence in the same transaction. */
async function approveEffect(tx:Tx,ctx:RequestContext,row:typeof placementLearnerGeneralRequests.$inferSelect){
 const p=row.payload;
 if(row.kind==="OFF_CAMPUS_OFFER"){
  const company=typeof p["companyName"]==="string"?p["companyName"].trim():"";
  const compensation=p["ctcLpa"]==null?null:typeof p["ctcLpa"]==="string"?p["ctcLpa"].trim():null;
  if(!company||company.length>200||
     (compensation!==null&&!/^(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/.test(compensation)))
   throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [offer]=await tx.insert(placementExternalOffers).values({
   collegeId:row.collegeId,membershipId:row.membershipId,
   companyName:company,ctcLpa:compensation,submittedByUserId:row.requestedByUserId,
   status:"VERIFIED",reviewedByUserId:ctx.user.id,reviewedAt:new Date(),
  }).returning({id:placementExternalOffers.id});
  if(!offer)throw new TpoGeneralRequestError("TARGET_CHANGED");
  await tx.insert(placementExternalOfferEvents).values({
   offerId:offer.id,priorStatus:null,nextStatus:"VERIFIED",actorUserId:ctx.user.id,
  });
  return {effect:"VERIFIED_EXTERNAL_OFFER",id:offer.id};
 }
 if(row.kind==="REGISTRATION_CHANGE"){
  const cohortId=String(p["cohortId"]??""),choice=String(p["choice"]??"");
  if(!["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED","ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].includes(choice))
   throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [enrollment]=await tx.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .where(and(eq(learnerProgramEnrollments.membershipId,row.membershipId),
    eq(learnerProgramEnrollments.cohortId,cohortId),
    eq(learnerProgramEnrollments.status,"ACTIVE"))).limit(1);
  if(!enrollment||choice==="PLACEMENTS"&&p["consentConfirmed"]!==true)
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
  if(!saved)throw new TpoGeneralRequestError("TARGET_CHANGED");
  await tx.insert(placementBatchRegistrationEvents).values({
   registrationId:saved.id,previousChoice:existing?.choice??null,nextChoice:choice,
   consentVersion:consent?"TPO-REQUEST-01":null,consentAt:consent?now:null,
   actorUserId:ctx.user.id,source:"TPO",
  });
  return {effect:"REGISTRATION_UPDATED",id:saved.id};
 }
 if(row.kind==="ABSENCE_DISPUTE"){
  // A dispute changes a real persisted ABSENT mark, never merely its queue
  // status. Recheck ownership/college/round association at decision time.
  const applicationId=sqlUuid.safeParse(p["applicationId"]),roundId=sqlUuid.safeParse(p["roundId"]);
  if(!applicationId.success||!roundId.success)throw new TpoGeneralRequestError("TARGET_CHANGED");
  const [record]=await tx.select({id:placementRoundAttendance.id,status:placementRoundAttendance.status})
   .from(placementRoundAttendance)
   .innerJoin(placementApplications,eq(placementApplications.id,placementRoundAttendance.applicationId))
   .innerJoin(placementJobRounds,and(eq(placementJobRounds.id,placementRoundAttendance.roundId),
    eq(placementJobRounds.jobId,placementApplications.jobId)))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementRoundAttendance.roundId,roundId.data),
    eq(placementRoundAttendance.applicationId,applicationId.data),
    eq(placementApplications.membershipId,row.membershipId),
    eq(placementJobs.collegeId,row.collegeId)))
   .for("update",{of:placementRoundAttendance}).limit(1);
  if(!record||record.status!=="ABSENT")throw new TpoGeneralRequestError("TARGET_CHANGED");
  const now=new Date();
  const [corrected]=await tx.update(placementRoundAttendance).set({
   status:"PRESENT",markedByUserId:ctx.user.id,markedAt:now,updatedAt:now,
  }).where(and(eq(placementRoundAttendance.id,record.id),
   eq(placementRoundAttendance.status,"ABSENT")))
   .returning({id:placementRoundAttendance.id});
  if(!corrected)throw new TpoGeneralRequestError("TARGET_CHANGED");
  await tx.insert(activityEvents).values({
   collegeId:row.collegeId,organizationId:ctx.membership!.organizationId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_ATTENDANCE_DISPUTE_CORRECTED",
   subjectType:"placement_round_attendance",subjectId:corrected.id,
   summary:"TPO corrected round absence after a student dispute",
   metadata:{requestId:row.id,applicationId:applicationId.data,roundId:roundId.data,
    previousStatus:"ABSENT",status:"PRESENT"},
  });
  return {effect:"ABSENCE_CORRECTED",id:corrected.id};
 }
 throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED");
}
export async function decideTpoGeneralRequest(ctx:RequestContext,rawId:unknown,raw:unknown){
 const college=await requireTpo(ctx);
 const id=sqlUuid.parse(rawId),decision=tpoGeneralRequestDecisionSchema.parse(raw);
 await requireRegistered();
 return getDb().transaction(async tx=>{
  // Keep an active-role SHARE lock for the entire write transaction so
  // concurrent membership revocation cannot race the request decision.
  await requireTpoJobActor(tx,ctx);
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


/** The global TPO Requests page composes this category with job-specific
 * requests. Keep a bounded independently scoped reader for request history. */
export async function listTpoGeneralRequestsPage(ctx:RequestContext,raw:unknown={}){
 const college=await requireTpo(ctx);
 await requireRegistered();
 const filter=z.strictObject({
  page:z.number().int().min(1).max(10000).default(1),
  pageSize:z.number().int().min(10).max(50).default(20),
  status:z.enum(["ALL","PENDING","APPROVED","REJECTED","CANCELLED"]).default("ALL"),
 }).parse(raw);
 const predicate=and(eq(placementLearnerGeneralRequests.collegeId,college.id),
  filter.status!=="ALL"?eq(placementLearnerGeneralRequests.status,filter.status):undefined);
 const [totalRows,rows]=await Promise.all([
  getDb().select({count:sql<number>`count(*)::int`}).from(placementLearnerGeneralRequests).where(predicate),
  getDb().select({
    id:placementLearnerGeneralRequests.id,kind:placementLearnerGeneralRequests.kind,
    status:placementLearnerGeneralRequests.status,reason:placementLearnerGeneralRequests.reason,
    membershipId:placementLearnerGeneralRequests.membershipId,
    requestedAt:placementLearnerGeneralRequests.requestedAt,
    decidedAt:placementLearnerGeneralRequests.decidedAt,
    decisionNote:placementLearnerGeneralRequests.decisionNote,
  }).from(placementLearnerGeneralRequests).where(predicate)
   .orderBy(desc(placementLearnerGeneralRequests.requestedAt),desc(placementLearnerGeneralRequests.id))
   .limit(filter.pageSize).offset((filter.page-1)*filter.pageSize),
 ]);
 const total=Number(totalRows[0]?.count??0);
 return {items:rows,total,page:filter.page,pageSize:filter.pageSize,
  totalPages:Math.max(1,Math.ceil(total/filter.pageSize))};
}
