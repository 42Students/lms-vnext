import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 placementCompanies,placementCompanyRelationships,placementJobs,placementRecruiterCollegeGrants,placementRecruiterDriveRequests,
 placementTpoCollegeSettings,placementTpoTrustedDomains,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {verifyOwnRecruiterJdObject} from "./recruiter-jd-upload-service";
import {can} from "@/modules/permissions/policy";
import {recruiterGrantEffectiveAt} from "./recruiter-grant-expiry-policy";
import {hrDriveDraftSchema} from "./hr-drive-draft-model";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {groupOwnRecruiterDriveRequests} from "@/db/schema/placement-drive-requests";
import {tpoComparableDriveSnapshot} from "./tpo-drive-request-diff-model";
import {recruiterDriveRequestInputSchema,recruiterRequestUpdateSchema} from "./recruiter-drive-request-model";
import {z} from "zod";
import {recruiterDriveApprovalPolicy,recruiterAutoApprovalExplanation} from "./recruiter-drive-autoapproval-policy";
import {createRecruiterApprovedDraftJob,RecruiterDraftApprovalError} from "./recruiter-approved-draft-job-service";

/** Resolve a historic recruiter Job bookmark without guessing which new
 * request it represents. The legacy integer ID is only a search key; the
 * selected active college and recruiter relationship remain mandatory.
 * Old Job records are NOT automatically approved/re-submitted as requests.
 */
export async function resolveOwnRecruiterLegacyJobLink(
  context:RequestContext,raw:unknown,
) {
  const input=z.strictObject({
    collegeId:z.string().uuid(),
    legacyJobId:z.number().int().positive(),
  }).parse(raw);
  const grant=requireOwnGrant(context,input.collegeId);
  const [job]=await getDb().select({
    jobId:placementJobs.id,
    collegeId:placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.legacyJobId,input.legacyJobId),
    eq(placementJobs.collegeId,input.collegeId),
    eq(placementJobs.companyRelationshipId,grant.companyRelationshipId),
  )).limit(1);
  if(!job)throw new RecruiterDriveRequestError("NOT_FOUND");
  const [request]=await getDb().select({
    requestId:placementRecruiterDriveRequests.id,
    status:placementRecruiterDriveRequests.status,
  }).from(placementRecruiterDriveRequests).where(and(
    eq(placementRecruiterDriveRequests.collegeId,input.collegeId),
    eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
    eq(placementRecruiterDriveRequests.sourceJobId,job.jobId),
  )).orderBy(desc(placementRecruiterDriveRequests.createdAt)).limit(1);
  return {jobId:job.jobId,requestId:request?.requestId??null,
    requestStatus:request?.status??null};
}

/** Each vNext request is intentionally scoped to one college, rather than
 * creating jobs for several colleges from one legacy drive-group request.
 * Preserve a stable single-college group receipt for historical UIs without
 * claiming that an unapproved REQUEST already has an approved job. */
function driveRequestReceipt(request:typeof placementRecruiterDriveRequests.$inferSelect){
 return {driveGroupId:request.id,requestId:request.id,
  colleges:[{collegeId:request.collegeId,jobId:request.approvedJobId,
   status:request.status,skippedReason:null as string|null}],
 };
}
export class RecruiterDriveRequestError extends Error{
 constructor(public readonly code:"FORBIDDEN"|"NOT_FOUND"|"STALE"|"INVALID_STATE"|"IDEMPOTENCY_CONFLICT"|"STORAGE_NOT_READY"){
  super(code);this.name="RecruiterDriveRequestError";
 }
}
function requireOwnGrant(context:RequestContext,collegeId:string){
 if(!hasActiveRecruiter(context)||!context.recruiter||context.recruiter.userId!==context.user.id)
  throw new RecruiterDriveRequestError("FORBIDDEN");
 const grant=context.recruiter.grants.find(g=>g.collegeId===collegeId);
 if(!grant || !can(context,"placements.recruiter.read",{collegeId,
  placementCompanyRelationshipId:grant.companyRelationshipId}))
  throw new RecruiterDriveRequestError("FORBIDDEN");
 return grant;
}
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function lockedRelationship(tx:Tx,context:RequestContext,collegeId:string){
 const grant=requireOwnGrant(context,collegeId);
 const [row]=await tx.select({relationshipId:placementCompanyRelationships.id,
  companyId:placementCompanyRelationships.companyId,collegeId:placementCompanyRelationships.collegeId,
  companyDomain:placementCompanies.primaryDomain,relationshipTrusted:placementCompanyRelationships.isTrusted,
  workEmail:users.email,
  relationshipStatus:placementCompanyRelationships.status,grant:placementRecruiterCollegeGrants,
  collegeStatus:colleges.status,organizationId:colleges.organizationId,
  userStatus:users.platformStatus,userEmail:users.email})
 .from(placementRecruiterCollegeGrants)
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
 .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
 .innerJoin(users,eq(users.id,placementRecruiterCollegeGrants.recruiterUserId))
 .where(and(eq(placementRecruiterCollegeGrants.id,grant.id),
   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   eq(placementCompanyRelationships.id,grant.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId)))
 .for("share").limit(1);
 if(!row || row.companyId!==context.recruiter!.companyId ||
    row.relationshipStatus!=="ACTIVE"||row.collegeStatus!=="ACTIVE"||
    row.userStatus!=="ACTIVE" || !recruiterGrantEffectiveAt(row.grant,new Date(),"DRIVES"))
   throw new RecruiterDriveRequestError("FORBIDDEN");
 return row;
}
async function informPlacementCell(tx:Tx,context:RequestContext,scope:{collegeId:string;organizationId:string},id:string,title:string,action:"NEW"|"UPDATED"|"CANCELLED"|"AUTO_APPROVED"="NEW",previousDraft?:unknown,currentDraft?:unknown,autoApproval?:{reason:string;jobId:string}){
 const headline=action==="AUTO_APPROVED"?"Recruiter drive request automatically approved":
  action==="NEW"?"New drive request from "+context.recruiter!.companyName:
  action==="UPDATED"?"Recruiter updated a drive request":"Recruiter cancelled a drive request";
 const [event]=await tx.insert(activityEvents).values({
  organizationId:scope.organizationId,collegeId:scope.collegeId,
  actorUserId:context.user.id,module:"PLACEMENTS",eventType:action==="AUTO_APPROVED"?"placements.recruiter.drive.auto_approved":
   action==="NEW"?"placements.recruiter.drive.requested":
    action==="UPDATED"?"placements.recruiter.drive.updated":"placements.recruiter.drive.cancelled",
  subjectType:"placement_recruiter_drive_request",subjectId:id,subjectLabel:title,
  summary:headline,metadata:{requestId:id,action,autoReason:autoApproval?.reason??null,approvedJobId:autoApproval?.jobId??null,
   ...(previousDraft&&currentDraft?{previousDraft:tpoComparableDriveSnapshot(previousDraft),
    currentDraft:tpoComparableDriveSnapshot(currentDraft)}:{})},
 }).returning({id:activityEvents.id});
 if(!event)throw new RecruiterDriveRequestError("STORAGE_NOT_READY");
 const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
  .from(collegeMemberships).innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE")));
 if(recipients.length) await tx.insert(inAppNotifications).values(recipients.map(recipient=>({
  userId:recipient.userId,eventId:event.id,title:headline,
  body:action==="AUTO_APPROVED"?"A verified recruiter request met this college\u0027s approval policy: "+
   recruiterAutoApprovalExplanation(autoApproval?.reason)+". A draft was created; the placement cell still controls publication.":
    action==="NEW"?"A recruiter sent a formal drive request. Open Drive lifecycle to inspect the recorded request.":
    action==="UPDATED"?"A recruiter saved changes to a drive request. Open Drive lifecycle to review the new version.":
    "A recruiter cancelled a drive request. Open Drive lifecycle to review its history.",actionHref:"/tpo/placements/lifecycle?view=REQUESTS",
 }))).onConflictDoNothing();
 if(action==="AUTO_APPROVED")await tx.insert(inAppNotifications).values({
  userId:context.user.id,eventId:event.id,title:"Drive request approved",
  body:"Your request is approved as a draft. The placement cell will publish the drive.",
  actionHref:"/recruiter/drives",
 }).onConflictDoNothing();
}
 /** REC-home-drives-21: writes registered 0101 table and TPO bell transactionally. */
export async function createOwnRecruiterDriveRequest(context:RequestContext,raw:unknown){
 const input=recruiterDriveRequestInputSchema.parse(raw);
 await verifyOwnRecruiterJdObject(context,input.collegeId,input.draft.jdObjectKey);
 return getDb().transaction(async tx=>{
  const scope=await lockedRelationship(tx,context,input.collegeId);
  // A repeated POST with the same nonce is a replay, not a 409 caused by
  // concurrent requests passing the first existence check together.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.submissionId}), 711021)`);
  const [existing]=await tx.select().from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
   eq(placementRecruiterDriveRequests.collegeId,input.collegeId),
   eq(placementRecruiterDriveRequests.submissionId,input.submissionId),
  )).limit(1);
  if(existing){
   const stored=hrDriveDraftSchema.safeParse(existing.draft);
   if(existing.sourceJobId!==(input.sourceJobId??null)||
      !stored.success||JSON.stringify(stored.data)!==JSON.stringify(input.draft))
    throw new RecruiterDriveRequestError("IDEMPOTENCY_CONFLICT");
   return {request:existing,replayed:true,...driveRequestReceipt(existing)};
  }
  if(input.sourceJobId){
    const [source]=await tx.select({id:placementJobs.id}).from(placementJobs)
      .where(and(eq(placementJobs.id,input.sourceJobId),
        eq(placementJobs.collegeId,input.collegeId),
        eq(placementJobs.companyRelationshipId,scope.relationshipId),
         recruiterOwnJobPredicate(context.user.id)))
      .for("share").limit(1);
    if(!source)throw new RecruiterDriveRequestError("FORBIDDEN");
  }
  // All policy inputs come from registered college/company/grant persistence.
  // Missing settings default to review; the requesting browser cannot override it.
  const [settings]=await tx.select({approvalRequired:placementTpoCollegeSettings.recruiterDriveNeedsApproval})
   .from(placementTpoCollegeSettings)
   .where(eq(placementTpoCollegeSettings.collegeId,input.collegeId)).limit(1);
  const trusted=await tx.select({domain:placementTpoTrustedDomains.domain})
   .from(placementTpoTrustedDomains)
   .where(eq(placementTpoTrustedDomains.collegeId,input.collegeId));
  const policy=recruiterDriveApprovalPolicy({
   approvalRequired:settings?.approvalRequired??true,
   grantVerified:scope.grant.verificationStatus==="VERIFIED",
   recruiterEmail:scope.workEmail,
   companyDomain:scope.companyDomain,
   trustedDomains:trusted.map(row=>row.domain),
   relationshipTrusted:scope.relationshipTrusted,
  });
  const [created]=await tx.insert(placementRecruiterDriveRequests).values({
   collegeId:input.collegeId,companyRelationshipId:scope.relationshipId,
   recruiterUserId:context.user.id,submissionId:input.submissionId,
   sourceJobId:input.sourceJobId??null,status:"REQUEST",draft:input.draft,
  }).onConflictDoNothing().returning();
  if(!created)throw new RecruiterDriveRequestError("IDEMPOTENCY_CONFLICT");
  let finalRequest=created;
  let approvedJobId:string|null=null;
  if(policy.autoApprove){
   try{
    approvedJobId=await createRecruiterApprovedDraftJob(tx,created,context.user.id);
    const [approved]=await tx.update(placementRecruiterDriveRequests).set({
      status:"DRAFT",approvedJobId,updatedAt:new Date(),
      // Policy auto-approval is audited as AUTO_APPROVED below, not a human
      // decision. The database requires decidedAt and decidedByUserId to
      // be either both populated or both null.
      decisionNote:null,decidedAt:null,decidedByUserId:null,
    }).where(eq(placementRecruiterDriveRequests.id,created.id)).returning();
    if(!approved)throw new RecruiterDriveRequestError("STORAGE_NOT_READY");
    finalRequest=approved;
   }catch(error){
    // Ambiguous seasons and incomplete drafts require human review.
    // Never drop a valid request or publish on an unreviewed assumption.
    if(!(error instanceof RecruiterDraftApprovalError))throw error;
   }
  }
  await informPlacementCell(tx,context,{collegeId:input.collegeId,organizationId:scope.organizationId},
   created.id,input.draft.title,approvedJobId?"AUTO_APPROVED":"NEW",undefined,undefined,
   approvedJobId?{reason:policy.reason,jobId:approvedJobId}:undefined);
  return {request:finalRequest,replayed:false,...driveRequestReceipt(finalRequest)};
 });
}
export async function listOwnRecruiterDriveRequests(context:RequestContext,collegeId:string){
 const id=z.string().uuid().parse(collegeId);
 return getDb().transaction(async tx=>{
  const scope=await lockedRelationship(tx,context,id);
  const requests=await tx.select().from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.collegeId,id),
   eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
   eq(placementRecruiterDriveRequests.companyRelationshipId,scope.relationshipId)))
   // Old Recruiter Drives prioritized corrections sent back by the TPO;
   // stable UUID is the tie-breaker if two requests share a timestamp.
   .orderBy(sql`case
     when ${placementRecruiterDriveRequests.status} = 'SENT_BACK' then 0
     when ${placementRecruiterDriveRequests.status} = 'REQUEST' then 1
     when ${placementRecruiterDriveRequests.status} = 'DRAFT' then 2
     when ${placementRecruiterDriveRequests.status} = 'REJECTED' then 3
     when ${placementRecruiterDriveRequests.status} = 'CANCELLED' then 4
     else 5 end`,
     desc(placementRecruiterDriveRequests.createdAt),
     desc(placementRecruiterDriveRequests.id));
  const approvedIds=requests.flatMap(request=>request.approvedJobId?[request.approvedJobId]:[]);
  const jobs=approvedIds.length?await tx.select({
   id:placementJobs.id,status:placementJobs.status,
  }).from(placementJobs).where(and(
   eq(placementJobs.collegeId,id),
   eq(placementJobs.companyRelationshipId,scope.relationshipId),
   inArray(placementJobs.id,approvedIds),
  )):[];
  const statuses=new Map(jobs.map(job=>[job.id,job.status]));
  return requests.map(request=>({
   ...request,
   approvedJobStatus:request.approvedJobId?
    statuses.get(request.approvedJobId)??null:null,
  }));
 });
}
export async function updateOwnRecruiterDriveRequest(context:RequestContext,raw:unknown){
 const input=recruiterRequestUpdateSchema.parse(raw);
 if(input.draft)await verifyOwnRecruiterJdObject(context,input.collegeId,input.draft.jdObjectKey);
 return getDb().transaction(async tx=>{
  const scope=await lockedRelationship(tx,context,input.collegeId);
  const [original]=await tx.select().from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.id,input.requestId),
   eq(placementRecruiterDriveRequests.collegeId,input.collegeId),
   eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
   eq(placementRecruiterDriveRequests.companyRelationshipId,scope.relationshipId))).for("update").limit(1);
  if(!original)throw new RecruiterDriveRequestError("NOT_FOUND");
  if(original.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new RecruiterDriveRequestError("STALE");
  if(input.action==="EDIT" && (original.status!=="REQUEST"||!input.draft))
   throw new RecruiterDriveRequestError("INVALID_STATE");
  if(input.action==="RESUBMIT" && (original.status!=="SENT_BACK"||!input.draft))
   throw new RecruiterDriveRequestError("INVALID_STATE");
  if(input.action==="CANCEL" && !["REQUEST","SENT_BACK"].includes(original.status))
   throw new RecruiterDriveRequestError("INVALID_STATE");
  const [updated]=await tx.update(placementRecruiterDriveRequests).set({
   status:input.action==="CANCEL"?"CANCELLED":"REQUEST",
   ...(input.draft?{draft:input.draft}:{}),
   decisionNote:null,decidedAt:null,decidedByUserId:null,
   updatedAt:sql`greatest(clock_timestamp(), ${placementRecruiterDriveRequests.updatedAt} + interval '1 millisecond')`,
  }).where(eq(placementRecruiterDriveRequests.id,original.id)).returning();
  if(!updated)throw new RecruiterDriveRequestError("STALE");
  // A cancelled request must leave an audit/bell trail as well as an updated row.
  await informPlacementCell(tx,context,{
   collegeId:input.collegeId,organizationId:scope.organizationId},updated.id,
   String(input.draft?.title??(original.draft as {title?:string})?.title??"Drive request"),
   input.action==="CANCEL"?"CANCELLED":"UPDATED",
   input.action==="RESUBMIT"?original.draft:undefined,
   input.action==="RESUBMIT"?input.draft:undefined);
  return updated;
 });
}

/** Legacy list groups copies by plan while keeping every row inside the
 * recruiter's persisted grant for the explicitly selected college. */
export async function listOwnRecruiterDriveRequestGroups(context:RequestContext,collegeId:string){
 const requests=await listOwnRecruiterDriveRequests(context,collegeId);
 return groupOwnRecruiterDriveRequests(requests,collegeId,context.user.id);
}
