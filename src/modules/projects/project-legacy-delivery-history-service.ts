import "server-only";
import {desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectSubmissions,projectDeliveryEvents,projectSubmissionReviews} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {legacyDeliveryEventLabel,legacyRevisionCountFromVersion} from "./project-legacy-parity-model";

type TimelineRow={
 id:string; submissionId:string; action:string; label:string;
 occurredAt:Date; revisionCount:number|null;
 actorName:string; actorRole:string|null;
 notes:string|null;feedback:string|null;attachmentCount:number;
};
const clean=(raw:string|null)=>raw?.trim().slice(0,4000)||null;
/** Tenant-scoped legacy delivery timeline. No raw legacy attachment links,
 * arbitrary metadata or contact details are exposed in this read response.
 * Verified files are opened through their own authorized signed-grant flow.
 */
export async function getLegacyProjectDeliveryHistory(
 context:RequestContext,projectId:string,limit=100,
) {
 const scope=await requireProjectReadAccess(context,projectId);
 const take=Number.isSafeInteger(limit)?Math.min(200,Math.max(1,limit)):100;
 const submissions=await getDb().select({
   id:projectSubmissions.id,version:projectSubmissions.version,
   status:projectSubmissions.status,createdAt:projectSubmissions.createdAt,
   updatedAt:projectSubmissions.updatedAt,submittedAt:projectSubmissions.submittedAt,
   attachments:projectSubmissions.attachments,
   legacyRevisionCount:projectSubmissions.legacyRevisionCount,
   legacyDraftSavedAt:projectSubmissions.legacyDraftSavedAt,
   legacyDraftSavedByName:projectSubmissions.legacyDraftSavedByName,
   legacySubmittedByName:projectSubmissions.legacySubmittedByName,
   legacySubmittedByType:projectSubmissions.legacySubmittedByType,
   legacyPrimaryAttachmentUrl:projectSubmissions.legacyPrimaryAttachmentUrl,
 }).from(projectSubmissions).where(eq(projectSubmissions.projectId,scope.project.id))
 .orderBy(desc(projectSubmissions.version)).limit(200);
 const submissionIds=submissions.map(row=>row.id);
 if(!submissionIds.length)return {projectId:scope.project.id,items:[],hasMore:false};
 const rows:TimelineRow[]=[];
 for(const submission of submissions){
   const revision=submission.legacyRevisionCount??
     legacyRevisionCountFromVersion(submission.version);
   const files=Array.isArray(submission.attachments)?submission.attachments.length:0;
   rows.push({
     id:submission.id+":created",submissionId:submission.id,
     action:"DRAFT_SAVED",label:"Draft saved",
     occurredAt:submission.legacyDraftSavedAt??submission.createdAt,
     revisionCount:revision,actorName:submission.legacyDraftSavedByName?.trim()||"Project member",
     actorRole:null,notes:null,feedback:null,attachmentCount:files,
   });
   if(submission.submittedAt)rows.push({
     id:submission.id+":submitted",submissionId:submission.id,
     action:"SUBMITTED",label:"Submitted",
     occurredAt:submission.submittedAt,revisionCount:revision,
     actorName:submission.legacySubmittedByName?.trim()||"Project member",
     actorRole:submission.legacySubmittedByType,
     notes:null,feedback:null,attachmentCount:files,
   });
 }
 // Every individual historical event is linked to the authorized project and
 // one of its submissions by the composite database foreign key.
 const technical=await getDb().select().from(projectDeliveryEvents)
   .where(eq(projectDeliveryEvents.projectId,scope.project.id))
   .orderBy(desc(projectDeliveryEvents.occurredAt),desc(projectDeliveryEvents.id))
   .limit(200);
 for(const event of technical){
   const submission=submissions.find(row=>row.id===event.submissionId);
   if(!submission)continue;
   rows.push({
     id:event.id,submissionId:event.submissionId,
     action:event.legacyAction||event.eventType,
     label:legacyDeliveryEventLabel(event.legacyAction||event.eventType),
     occurredAt:event.occurredAt,
     revisionCount:event.legacyRevisionCount??
       submission.legacyRevisionCount??legacyRevisionCountFromVersion(submission.version),
     actorName:event.legacyActorName?.trim()||"Project member",
     actorRole:event.legacyActorType,
     notes:clean(event.legacyNotes||(scope.access==="ADMIN"?event.reason:null)),
     feedback:clean(event.legacyFeedback),
     attachmentCount:Array.isArray(submission.attachments)?submission.attachments.length:0,
   });
 }
 const reviews=await getDb().select().from(projectSubmissionReviews)
   .where(eq(projectSubmissionReviews.projectId,scope.project.id))
   .orderBy(desc(projectSubmissionReviews.reviewedAt)).limit(200);
 for(const review of reviews){
   const submission=submissions.find(s=>s.id===review.submissionId);
   if(!submission)continue;
   rows.push({
     id:review.id,submissionId:review.submissionId,action:"REVIEWED",
     label:legacyDeliveryEventLabel(review.decision),
     occurredAt:review.reviewedAt,
     revisionCount:submission.legacyRevisionCount??
       legacyRevisionCountFromVersion(submission.version),
     actorName:"Reviewer",actorRole:"REVIEWER",notes:null,
     feedback:clean(review.feedback),
     attachmentCount:Array.isArray(submission.attachments)?submission.attachments.length:0,
   });
 }
 rows.sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime()||
   b.id.localeCompare(a.id));
 return {projectId:scope.project.id,items:rows.slice(0,take),hasMore:rows.length>take};
}
