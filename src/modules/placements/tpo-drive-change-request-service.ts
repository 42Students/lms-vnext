import "server-only";
import {and,asc,desc,eq,gt,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,
 placementCompanyRelationships,placementJobs,placementRecruiterCollegeGrants,users} from "@/db/schema";
import {placementDriveChangeRequests,placementDriveChangeRequestMessages} from "@/db/schema/placement-drive-change-requests";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementTableExists} from "./staged-tables";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {placementJobIdSchema} from "./validation";
import {driveChangeCommandSchema} from "./tpo-drive-change-request-model";

type Party="TPO"|"COMPANY";
async function scoped(context:RequestContext,rawJobId:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 if(context.membership&&hasMembershipRole(context,"TPO")){
  const collegeId=await requireTpoJobCollege(context);
  const [job]=await getDb().select({
   id:placementJobs.id,collegeId:placementJobs.collegeId,title:placementJobs.title,
   status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId,
  }).from(placementJobs).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  return {job,party:"TPO" as Party};
 }
 // Existing recruiter workspace performs its own company/grant/status checks.
 const existing=await getRecruiterPlacementWorkspace(context,jobId);
 const [job]=await getDb().select({
  id:placementJobs.id,collegeId:placementJobs.collegeId,title:placementJobs.title,
  status:placementJobs.status,companyRelationshipId:placementJobs.companyRelationshipId,
 }).from(placementJobs).where(and(eq(placementJobs.id,existing.job.id),
  eq(placementJobs.collegeId,existing.college.id))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {job,party:"COMPANY" as Party};
}
async function recipients(tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 job:{collegeId:string;companyRelationshipId:string},party:Party){
 if(party==="TPO"){
  const members=await tx.select({userId:collegeMemberships.userId}).from(collegeMemberships)
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,job.collegeId),eq(collegeMemberships.status,"ACTIVE"),
    eq(membershipRoles.role,"TPO"),eq(users.platformStatus,"ACTIVE")));
  return [...new Set(members.map(r=>r.userId))];
 }
 const grants=await tx.select({userId:placementRecruiterCollegeGrants.recruiterUserId})
  .from(placementRecruiterCollegeGrants)
  .innerJoin(users,eq(users.id,placementRecruiterCollegeGrants.recruiterUserId))
  .where(and(eq(placementRecruiterCollegeGrants.companyRelationshipId,job.companyRelationshipId),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   gt(placementRecruiterCollegeGrants.validUntil,new Date()),
   eq(users.platformStatus,"ACTIVE")));
 return [...new Set(grants.map(r=>r.userId))];
}
async function announce(tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 context:RequestContext,job:{id:string;collegeId:string;companyRelationshipId:string;title:string},
 target:Party,kind:string,requestId:string,body:string){
 const [event]=await tx.insert(activityEvents).values({
  organizationId:context.membership?.organizationId??null,collegeId:job.collegeId,
  actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
  module:"PLACEMENTS",eventType:kind,subjectType:"placement_drive_change",
  subjectId:requestId,summary:body,metadata:{jobId:job.id,requestId},
 }).returning({id:activityEvents.id});
 if(!event)throw Error("Change-request audit could not be saved.");
 const ids=(await recipients(tx,job,target)).filter(id=>id!==context.user.id);
 const href=target==="TPO"?"/tpo/placements/jobs/"+job.id+"/change-requests":
  "/recruiter/drives/"+job.id+"/change-requests";
 for(let i=0;i<ids.length;i+=200){
  await tx.insert(inAppNotifications).values(ids.slice(i,i+200).map(userId=>({
   userId,eventId:event.id,title:"Drive change request",body,actionHref:href,
  }))).onConflictDoNothing();
 }
}
export async function getDriveChangeRequests(context:RequestContext,jobId:unknown){
 const {job,party}=await scoped(context,jobId);
 const storageReady=await placementTableExists("placement_drive_change_requests")&&
  await placementTableExists("placement_drive_change_request_messages");
 if(!storageReady)return {job,party,storageReady,requests:[],
  pendingMessage:"Company change requests are pending database migration registration."};
 const requests=await getDb().select().from(placementDriveChangeRequests)
  .where(eq(placementDriveChangeRequests.jobId,job.id))
  .orderBy(desc(placementDriveChangeRequests.createdAt))
  .limit(100);
 const messages=requests.length?await getDb().select().from(placementDriveChangeRequestMessages)
  .where(inArray(placementDriveChangeRequestMessages.requestId,requests.map(r=>r.id)))
  .orderBy(asc(placementDriveChangeRequestMessages.sentAt)):[];
 return {job,party,storageReady,pendingMessage:null,
  requests:requests.map(r=>({
   ...r,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString(),
   decidedAt:r.decidedAt?.toISOString()??null,
   messages:messages.filter(m=>m.requestId===r.id).map(m=>({
    ...m,sentAt:m.sentAt.toISOString(),
   })),
  }))};
}
export async function mutateDriveChangeRequest(context:RequestContext,rawJobId:unknown,raw:unknown){
 const {job,party}=await scoped(context,rawJobId);
 if(!await placementTableExists("placement_drive_change_requests")||
  !await placementTableExists("placement_drive_change_request_messages"))
  throw Error("Company change request storage has not been registered.");
 const input=driveChangeCommandSchema.parse(raw);
 return getDb().transaction(async tx=>{
  const [lockedJob]=await tx.select({status:placementJobs.status})
   .from(placementJobs).where(and(eq(placementJobs.id,job.id),
    eq(placementJobs.collegeId,job.collegeId))).for("share").limit(1);
  if(!lockedJob||lockedJob.status==="ARCHIVED"||lockedJob.status==="CANCELLED")
   throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  if(input.action==="CREATE"){
   const target:Party=party==="TPO"?"COMPANY":"TPO";
   const [created]=await tx.insert(placementDriveChangeRequests).values({
    jobId:job.id,createdByUserId:context.user.id,proposerParty:party,targetParty:target,
    mode:input.mode,field:input.field,proposedValue:input.proposedValue,reason:input.reason,
   }).returning();
   await announce(tx,context,job,target,"PLACEMENTS_DRIVE_CHANGE_REQUEST_CREATED",created.id,
    "New "+input.field.toLowerCase()+" change request for "+job.title+".");
   return {id:created.id,status:created.status};
  }
  const [request]=await tx.select().from(placementDriveChangeRequests)
   .where(and(eq(placementDriveChangeRequests.id,input.requestId),
    eq(placementDriveChangeRequests.jobId,job.id))).for("update").limit(1);
  if(!request)throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
  if(input.action==="COMMENT"){
   if(request.status==="WITHDRAWN")throw new Error("Withdrawn requests cannot receive messages.");
   const [message]=await tx.insert(placementDriveChangeRequestMessages).values({
    requestId:request.id,senderUserId:context.user.id,senderParty:party,body:input.body,
   }).returning({id:placementDriveChangeRequestMessages.id});
   await announce(tx,context,job,party==="TPO"?"COMPANY":"TPO",
    "PLACEMENTS_DRIVE_CHANGE_COMMENTED",request.id,
    "New reply in the "+request.field.toLowerCase()+" change request for "+job.title+".");
   return {id:message.id,status:"COMMENTED"};
  }
  if(request.status!=="OPEN"||request.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_INVALID_STATE");
  if(input.action==="WITHDRAW"){
   if(request.proposerParty!==party||request.createdByUserId!==context.user.id)
    throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  }else if(request.targetParty!==party)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  const status=input.action==="ACCEPT"?"ACCEPTED":
   input.action==="ANSWER"?"ANSWERED":input.action==="DECLINE"?"DECLINED":"WITHDRAWN";
  const [updated]=await tx.update(placementDriveChangeRequests).set({
   status,decisionNote:input.note,decidedByUserId:context.user.id,decidedAt:new Date(),
   updatedAt:new Date(),
  }).where(and(eq(placementDriveChangeRequests.id,request.id),
   eq(placementDriveChangeRequests.status,"OPEN"))).returning({id:placementDriveChangeRequests.id});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_REQUEST_INVALID_STATE");
  await announce(tx,context,job,party==="TPO"?"COMPANY":"TPO",
   "PLACEMENTS_DRIVE_CHANGE_REQUEST_DECIDED",request.id,
   "Your change request about "+request.field.toLowerCase()+" was "+status.toLowerCase()+". "+input.note);
  return {id:updated.id,status};
 });
}
