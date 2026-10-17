import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 placementCompanyRelationships,placementJobs,placementRecruiterCollegeGrants,placementRecruiterDriveRequests,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {recruiterGrantEffectiveAt} from "./recruiter-grant-expiry-policy";
import {hrDriveDraftSchema} from "./hr-drive-draft-model";
import {tpoComparableDriveSnapshot} from "./tpo-drive-request-diff-model";
import {recruiterDriveRequestInputSchema,recruiterRequestUpdateSchema,canRecruiterResubmit} from "./recruiter-drive-request-model";
import {z} from "zod";

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
  relationshipStatus:placementCompanyRelationships.status,grant:placementRecruiterCollegeGrants,
  collegeStatus:colleges.status,organizationId:colleges.organizationId,
  userStatus:users.platformStatus})
 .from(placementRecruiterCollegeGrants)
 .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
 .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
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
async function informPlacementCell(tx:Tx,context:RequestContext,scope:{collegeId:string;organizationId:string},id:string,title:string,action:"NEW"|"UPDATED"|"CANCELLED"="NEW",previousDraft?:unknown,currentDraft?:unknown){
 const headline=action==="NEW"?"New drive request from "+context.recruiter!.companyName:
  action==="UPDATED"?"Recruiter updated a drive request":"Recruiter cancelled a drive request";
 const [event]=await tx.insert(activityEvents).values({
  organizationId:scope.organizationId,collegeId:scope.collegeId,
  actorUserId:context.user.id,module:"PLACEMENTS",eventType:action==="NEW"?"placements.recruiter.drive.requested":
    action==="UPDATED"?"placements.recruiter.drive.updated":"placements.recruiter.drive.cancelled",
  subjectType:"placement_recruiter_drive_request",subjectId:id,subjectLabel:title,
  summary:headline,metadata:{requestId:id,action,
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
  body:action==="NEW"?"A recruiter sent a formal drive request. Open Drive lifecycle to inspect the recorded request.":
    action==="UPDATED"?"A recruiter saved changes to a drive request. Open Drive lifecycle to review the new version.":
    "A recruiter cancelled a drive request. Open Drive lifecycle to review its history.",actionHref:"/tpo/placements/lifecycle?view=REQUESTS",
 }))).onConflictDoNothing();
}
/** REC-home-drives-21: writes registered 0101 table and TPO bell transactionally. */
export async function createOwnRecruiterDriveRequest(context:RequestContext,raw:unknown){
 const input=recruiterDriveRequestInputSchema.parse(raw);
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
   return {request:existing,replayed:true};
  }
  if(input.sourceJobId){
    const [source]=await tx.select({id:placementJobs.id}).from(placementJobs)
      .where(and(eq(placementJobs.id,input.sourceJobId),
        eq(placementJobs.collegeId,input.collegeId),
        eq(placementJobs.companyRelationshipId,scope.relationshipId)))
      .for("share").limit(1);
    if(!source)throw new RecruiterDriveRequestError("FORBIDDEN");
  }
  // No auto-approval until the shared TPO-side policy is registered. REQUEST is real/pending.
  const [created]=await tx.insert(placementRecruiterDriveRequests).values({
   collegeId:input.collegeId,companyRelationshipId:scope.relationshipId,
   recruiterUserId:context.user.id,submissionId:input.submissionId,
   sourceJobId:input.sourceJobId??null,status:"REQUEST",draft:input.draft,
  }).onConflictDoNothing().returning();
  if(!created)throw new RecruiterDriveRequestError("IDEMPOTENCY_CONFLICT");
  await informPlacementCell(tx,context,{collegeId:input.collegeId,organizationId:scope.organizationId},
   created.id,input.draft.title);
  return {request:created,replayed:false};
 });
}
export async function listOwnRecruiterDriveRequests(context:RequestContext,collegeId:string){
 const id=z.string().uuid().parse(collegeId);
 return getDb().transaction(async tx=>{
  const scope=await lockedRelationship(tx,context,id);
  return tx.select().from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.collegeId,id),
   eq(placementRecruiterDriveRequests.recruiterUserId,context.user.id),
   eq(placementRecruiterDriveRequests.companyRelationshipId,scope.relationshipId)))
   .orderBy(desc(placementRecruiterDriveRequests.createdAt));
 });
}
export async function updateOwnRecruiterDriveRequest(context:RequestContext,raw:unknown){
 const input=recruiterRequestUpdateSchema.parse(raw);
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
   decisionNote:null,decidedAt:null,decidedByUserId:null,updatedAt:new Date(),
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
