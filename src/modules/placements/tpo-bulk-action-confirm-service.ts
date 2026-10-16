import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getAuthConfig} from "@/modules/auth/config";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {TpoParticipationConflictError,decideTpoLearnerParticipation,
  getTpoLearnerParticipation} from "./tpo-participation-service";
import {reviewTpoApplicant} from "./tpo-applicant-review-service";
import {loadTpoBulkCurrent} from "./tpo-bulk-action-preview-service";
import {tpoBulkStudentVersion} from "./tpo-bulk-decision-model";
import {tpoBulkConfirmRequestSchema,tpoBulkPreviewRequestSchema,
  safeBulkActionFailure} from "./tpo-bulk-workflow-model";
import {verifyTpoBulkPreview} from "./tpo-bulk-preview-token";
import type {BulkOutcome} from "./tpo-bulk-action-model";

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
 const outcomes:BulkOutcome[]=[];
 for(const selected of input.selections){
   const state=current.get(selected.id);
   if(!state?.ready||state.version!==selected.version){
     outcomes.push({id:selected.id,status:"skipped",reason:safeBulkActionFailure()});
     continue;
   }
   try{
     if(plan.target==="STUDENTS"){
       const record=await getTpoLearnerParticipation(context,selected.id);
       if(tpoBulkStudentVersion(record.direct)!==selected.version){
         outcomes.push({id:selected.id,status:"skipped",reason:safeBulkActionFailure()});
         continue;
       }
       const response=await decideTpoLearnerParticipation(context,selected.id,{
         status:plan.action==="ELIGIBLE"?"ELIGIBLE":plan.action==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED",
         ...(plan.action==="INELIGIBLE"?{reason:plan.note}:{}),
         expected:record.direct,
       });
       outcomes.push({id:selected.id,status:response.changed?"updated":"skipped",reason:null});
     }else{
       if(plan.action!=="SHORTLISTED"&&plan.action!=="REJECTED")throw new TpoBulkPreviewError();
       await reviewTpoApplicant(context,{jobId:plan.jobId,applicationId:selected.id},{
         confirmed:true,expectedUpdatedAt:selected.version,
         decision:plan.action,note:plan.note,
       });
       outcomes.push({id:selected.id,status:"updated",reason:null});
     }
   }catch(error){
     if(error instanceof PlacementsServiceError||
        error instanceof TpoParticipationConflictError||
        error instanceof AuthorizationError){
       outcomes.push({id:selected.id,status:"skipped",reason:safeBulkActionFailure()});
       continue;
     }
     throw error;
   }
 }
 return {outcomes,counts:{
   updated:outcomes.filter(item=>item.status==="updated").length,
   skipped:outcomes.filter(item=>item.status==="skipped").length,
   failed:outcomes.filter(item=>item.status==="failed").length,
 }};
}
