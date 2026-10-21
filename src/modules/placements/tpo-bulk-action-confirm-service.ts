import "server-only";
import {recordActivityEvent} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {getAuthConfig} from "@/modules/auth/config";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {TpoParticipationConflictError,decideTpoLearnerParticipation,
  getTpoLearnerParticipation} from "./tpo-participation-service";
import {reviewTpoApplicant} from "./tpo-applicant-review-service";
import {addTpoApplicantNote} from "./applicant-notes-service";
import {moveTpoBulkApplicationStage,TpoBulkStageError} from "./tpo-bulk-application-stage-service";
import {sendTpoBulkApplicationMessage} from "./tpo-bulk-applicant-message-service";
import {loadTpoBulkCurrent} from "./tpo-bulk-action-preview-service";
import {tpoBulkStudentVersion} from "./tpo-bulk-decision-model";
import {tpoBulkConfirmRequestSchema,tpoBulkPreviewRequestSchema,
  safeBulkActionFailure} from "./tpo-bulk-workflow-model";
import {verifyTpoBulkPreview} from "./tpo-bulk-preview-token";
import type {BulkOutcome} from "./tpo-bulk-action-model";
import {mapTpoBulkBounded} from "./tpo-bulk-bounded-execution";

export class TpoBulkPreviewError extends Error {
 constructor(){super("BULK_PREVIEW_EXPIRED_OR_CHANGED");this.name="TpoBulkPreviewError";}
}
/** Only signed, previewed exact rows can be submitted. Existing audited writers own all mutations. */
export async function confirmTpoBulkAction(context:RequestContext,raw:unknown){
 const input=tpoBulkConfirmRequestSchema.parse(raw);
 const plan=tpoBulkPreviewRequestSchema.parse({
   target:input.target,jobId:input.jobId,action:input.action,note:input.note,ids:input.ids,
 });
 if(input.selections.length!==plan.ids.length||
    input.selections.some((row,index)=>row.id!==plan.ids[index]))throw new TpoBulkPreviewError();
 const actor=context.user.id+":"+(context.membership?.id??"");
 if(!verifyTpoBulkPreview(getAuthConfig().secret,actor,plan,
     input.selections,input.previewToken))throw new TpoBulkPreviewError();
 const current=await loadTpoBulkCurrent(context,plan);
 type RowResult={outcome:BulkOutcome;
  undo:{membershipId:string;actionId:string;afterUpdatedAt:string|null}|null};
 // Independent application/member IDs are unique by the request schema.
 // Keep at most six concurrent DB writes; preserve selected order in both
 // the UI results and the audited undo token regardless of completion order.
 const completed=await mapTpoBulkBounded(input.selections,async(selected):Promise<RowResult>=>{
   const state=current.get(selected.id);
   if(!state?.ready||state.version!==selected.version){
     return {outcome:{id:selected.id,status:"skipped",reason:safeBulkActionFailure()},undo:null};
   }
   try{
     if(plan.target==="STUDENTS"){
       const record=await getTpoLearnerParticipation(context,selected.id);
       if(tpoBulkStudentVersion(record.direct)!==selected.version){
         return {outcome:{id:selected.id,status:"skipped",reason:safeBulkActionFailure()},undo:null};
       }
       const response=await decideTpoLearnerParticipation(context,selected.id,{
         status:plan.action==="ELIGIBLE"?"ELIGIBLE":plan.action==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED",
         ...(plan.action==="INELIGIBLE"?{reason:plan.note}:{}),
         expected:record.direct,
       });
       return {
         outcome:{id:selected.id,status:response.changed?"updated":"skipped",reason:null},
         undo:response.changed&&response.actionId?{
           membershipId:selected.id,actionId:response.actionId,
           afterUpdatedAt:response.direct.updatedAt,
         }:null,
       };
     }
     if(plan.action==="MOVE_TEST"||plan.action==="MOVE_INTERVIEW"){
       await moveTpoBulkApplicationStage(context,plan.jobId!,selected.id,plan.action,selected.version);
     }else if(plan.action==="ADD_NOTE"){
       await addTpoApplicantNote(context,plan.jobId!,selected.id,{
         body:plan.note,expectedLatestNoteId:selected.version==="none"?null:selected.version,
       });
     }else if(plan.action==="SEND_MESSAGE"){
       await sendTpoBulkApplicationMessage(context,{
         jobId:plan.jobId!,applicationId:selected.id,
         expectedVersion:selected.version,body:plan.note,
       });
     }else{
       if(plan.action!=="SHORTLISTED"&&plan.action!=="REJECTED")throw new TpoBulkPreviewError();
       await reviewTpoApplicant(context,{jobId:plan.jobId,applicationId:selected.id},{
         confirmed:true,expectedUpdatedAt:selected.version,
         decision:plan.action,note:plan.note,
       });
     }
     return {outcome:{id:selected.id,status:"updated",reason:null},undo:null};
   }catch(error){
     if(error instanceof TpoBulkStageError){
       const reason = error.code === "STAGE_NOT_ALLOWED"
         ? "Students can be moved only to Shortlisted, Test or Interview"
         : error.code === "STAGE_STALE" ? "Applicant changed; preview again" : "Stage storage is not ready";
       return {outcome:{id:selected.id,status:"skipped",reason},undo:null};
     }
     if(error instanceof PlacementsServiceError||
        error instanceof TpoParticipationConflictError||
        error instanceof AuthorizationError){
       return {outcome:{id:selected.id,status:"skipped",reason:safeBulkActionFailure()},undo:null};
     }
     // A previously completed row already committed; preserve each result
     // rather than suggesting an unsafe blind retry after a database outage.
     return {outcome:{id:selected.id,status:"failed",reason:safeBulkActionFailure()},undo:null};
   }
 },6);
 const outcomes=completed.map(row=>row.outcome);
 const undoRows=completed.flatMap(row=>row.undo?[row.undo]:[]);
 const updated=outcomes.filter(item=>item.status==="updated").length;
 const skipped=outcomes.filter(item=>item.status==="skipped").length;
 const failed=outcomes.filter(item=>item.status==="failed").length;
 let auditId:string|null=null;
 let summaryRecorded=false;
 try{
  const audit=await recordActivityEvent(context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_BULK_RUN,
   collegeId:context.membership!.collegeId,
   organizationId:context.membership!.organizationId,
   subjectType:plan.target==="APPLICATIONS"?"placement_job":"placement_college",
   subjectId:plan.jobId??context.membership!.collegeId,
   summary:"Placement bulk action: "+plan.action+" — "+updated+" updated, "+skipped+" skipped",
   metadata:{target:plan.target,action:plan.action,selected:plan.ids.length,
    updated,skipped,failed,jobId:plan.jobId??null,undoRows:plan.target==="STUDENTS"?undoRows:[]},
 });
  auditId=audit.id;
  summaryRecorded=true;
 }catch{
  // Each successful row writes its own activity in a transaction. Losing the
  // aggregate cannot mean the bulk actions were undone. Aggregate undo is
  // unavailable until a persisted batch summary exists.
 }
 return {outcomes,summaryRecorded,applicationActionsReversible:false,
  undoWindowSeconds:plan.target==="STUDENTS"?300:0,
  summaryWarning:summaryRecorded?null:
   "Some decisions may have been saved, but the batch summary could not be recorded. Refresh and review history before retrying.",
  runAuditId:plan.target==="STUDENTS"&&undoRows.length?auditId:null,counts:{
   updated:outcomes.filter(item=>item.status==="updated").length,
   skipped:outcomes.filter(item=>item.status==="skipped").length,
   failed:outcomes.filter(item=>item.status==="failed").length,
 }};
}
