import type {
  projectSubmissions,
  projectSubmissionReviews,
  projectDeliveryEvents,
} from "@/db/schema";

type Submission=typeof projectSubmissions.$inferSelect;
type Review=typeof projectSubmissionReviews.$inferSelect;
type Event=typeof projectDeliveryEvents.$inferSelect;
type LegacyDeliveryState="DRAFT"|"SUBMITTED"|"CHANGES_REQUESTED"|"APPROVED"|"LOCKED";

/** Read-only legacy ProjectWorkspaceDTO final-delivery projection.
 * Never expose storage keys or invent a direct download URL for a private file.
 * Actual writes and authorization stay on the vNext submission endpoints.
 */
export function legacyProjectDeliveryProjection(input:{
  submissions:readonly Submission[];
  reviews:readonly Review[];
  deliveryEvents:readonly Event[];
}){
  const submissions=[...input.submissions].sort((a,b)=>a.version-b.version||
    a.id.localeCompare(b.id));
  const last=submissions[submissions.length-1]??null;
  const reviewsBySubmission=new Map(input.reviews.map(row=>[row.submissionId,row]));
  const eventsBySubmission=new Map<string,Event[]>();
  for(const event of input.deliveryEvents){
    eventsBySubmission.set(event.submissionId,[
      ...(eventsBySubmission.get(event.submissionId)??[]),event,
    ]);
  }
  function stamp(value:Date|null|undefined){return value?.toISOString()??null;}
  function evidence(submission:Submission){
    const attachments=submission.attachments;
    const mapped=(Array.isArray(attachments)?attachments:[]).map((value,index)=>{
      if(!value||typeof value!=="object"||Array.isArray(value))return null;
      const entry=value as Record<string,unknown>;
      const rawKind=typeof entry.kind==="string"?entry.kind.toUpperCase():"LINK";
      const kind=rawKind==="FILE"?"FILE":"LINK";
      const url=typeof entry.url==="string"&&/^https?:\/\//i.test(entry.url)
        ?entry.url:null;
      return {
        index,kind,
        label:typeof entry.label==="string"?entry.label:
          typeof entry.name==="string"?entry.name:"Evidence "+(index+1),
        fileName:typeof entry.fileName==="string"?entry.fileName:
          typeof entry.name==="string"?entry.name:null,
        fileId:kind==="FILE"&&typeof entry.fileId==="string"?entry.fileId:null,
        url,
        available:Boolean(url)||(kind==="FILE"&&typeof entry.fileId==="string"),
      };
    }).filter((row):row is NonNullable<typeof row>=>row!==null);
    if(!mapped.length&&submission.legacyPrimaryAttachmentUrl&&
       /^https?:\/\//i.test(submission.legacyPrimaryAttachmentUrl)){
      mapped.push({index:0,kind:"LINK",label:submission.legacyFileName??"Attachment",
        fileName:submission.legacyFileName,url:submission.legacyPrimaryAttachmentUrl,
        fileId:null,available:true});
    }
    return mapped;
  }
  function toState(submission:Submission):LegacyDeliveryState{
    if(submission.lockedAt)return "LOCKED";
    if(submission.status==="APPROVED")return "APPROVED";
    if(submission.status==="CHANGES_REQUESTED")return "CHANGES_REQUESTED";
    if(submission.status==="SUBMITTED")return "SUBMITTED";
    return "DRAFT";
  }
  const versions=submissions.map(submission=>{
    const review=reviewsBySubmission.get(submission.id)??null;
    const events=[...(eventsBySubmission.get(submission.id)??[])]
      .sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime()||
        a.id.localeCompare(b.id));
    return {
      id:submission.id,
      legacyDeliveryId:submission.legacyDeliveryId??null,
      version:submission.version,
      revisionCount:submission.legacyRevisionCount??null,
      status:toState(submission),
      normalizedStatus:submission.status,
      summary:submission.summary,
      notes:submission.notes??null,
      sourceUrl:submission.sourceUrl??null,
      demoUrl:submission.demoUrl??null,
      submittedAt:stamp(submission.submittedAt),
      submittedByMembershipId:submission.submittedByMembershipId,
      submittedByName:submission.legacySubmittedByName??null,
      submittedByType:submission.legacySubmittedByType??null,
      updatedAt:stamp(submission.updatedAt),
      lockedAt:stamp(submission.lockedAt),
      reopenedAt:stamp(submission.reopenedAt),
      attachments:evidence(submission),
      review:review?{
        decision:review.decision,feedback:review.feedback??null,
        reviewedAt:stamp(review.reviewedAt),
        reviewedByUserId:review.reviewedByUserId,
        reviewedByMembershipId:review.reviewedByMembershipId,
        reviewedByName:submission.legacyReviewedByName??null,
        reviewedByType:submission.legacyReviewedByType??null,
      }:null,
      events:events.map(event=>({
        id:event.id,kind:event.legacyAction??event.eventType,
        status:event.legacyStatus??null,reason:event.reason,
        actorName:event.legacyActorName??null,
        actorType:event.legacyActorType??null,
        occurredAt:stamp(event.occurredAt),
        revisionCount:event.legacyRevisionCount??null,
      })),
    };
  });
  const latest=versions[versions.length-1]??null;
  return {
    status:latest?.status??"NOT_SUBMITTED",
    latest,
    versions,
    versionCount:versions.length,
    revisionCount:last?.legacyRevisionCount??null,
    reviewed:versions.some(version=>version.review!==null),
    // Retain history separately from the latest summary to avoid showing
    // older accepted evidence as the current delivery.
    hasHistory:versions.length>1||input.deliveryEvents.length>0,
  };
}
