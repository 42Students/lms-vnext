import {createHash} from "node:crypto";
import {z} from "zod";
import {PlacementsServiceError} from "./errors";

/** Authoritative state gate evaluated on row-locked PostgreSQL evidence,
 * never on a stale preview snapshot from an earlier page render. */
export function assertTpoRoundApplyJobState(status:string|null):void{
 if(status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
}
export function assertTpoRoundApplyRoundState(status:string|null,kind:string|null):void{
 if(status!=="COMPLETED")throw new PlacementsServiceError("PLACEMENT_RESULT_ROUND_NOT_READY");
 if(kind==="TALK")throw new PlacementsServiceError("PLACEMENT_RESULT_INVALID_ROUND_TYPE");
}

export const roundApplyInputSchema=z.object({
 confirmed:z.literal(true),
 expectedPreviewToken:z.string().regex(/^[0-9a-f]{64}$/, "Invalid round preview token"),
}).strict();
export type RoundApplyRow={
 resultId:string;applicationId:string;student:string;outcome:string;
 status:string;version:number;
};
export function summarizeRoundApply(rows:readonly RoundApplyRow[]){
 const outcomes={PASS:0,FAIL:0,HOLD:0,ABSENT:0};
 for(const row of rows){if(row.status==="STAGED"&&Object.prototype.hasOwnProperty.call(outcomes,row.outcome))
   outcomes[row.outcome as keyof typeof outcomes]++;}
 return {staged:rows.filter(r=>r.status==="STAGED").length,
  applied:rows.filter(r=>r.status==="APPLIED").length,outcomes};
}
/** Return known actionable skip reasons; never expose SQL errors or arbitrary exception text. */
export function roundApplyFailureReason(error:unknown):string{
 if(error instanceof PlacementsServiceError){
  switch(error.code){
   case "PLACEMENT_RESULT_APPLICATION_INACTIVE":
    return "This application is no longer active. Review its stage before applying the result.";
   case "PLACEMENT_RESULT_SCREENING_NOT_SHORTLISTED":
    return "This applicant has not cleared screening. Shortlist the applicant first.";
   case "PLACEMENT_RESULT_NOT_PARTICIPANT":
    return "This applicant is not a participant in this round. Check the round roster.";
   case "PLACEMENT_RESULT_ALREADY_APPLIED":
    return "This result was already applied. Refresh this round to see the latest stage.";
   case "PLACEMENT_SCREENING_INVALID_TRANSITION":
   case "PLACEMENT_ROUND_INVALID_TRANSITION":
    return "Cannot move this applicant from the current stage to the next stage. Review the application history.";
   case "PLACEMENT_RESULT_ROUND_NOT_READY":
    return "This round is not completed yet. Complete it before applying results.";
   case "PLACEMENT_JOB_READ_ONLY":
    return "This drive is no longer writable. Review its status before retrying.";
   case "PLACEMENT_RESULT_INVALID_ROUND_TYPE":
    return "Results cannot be applied to a discussion-only round.";
   case "PLACEMENT_RESULT_NOT_FOUND":
    return "The staged result is missing. Refresh this round before retrying.";
   case "PLACEMENT_JOB_PREVIEW_STALE":
   case "PLACEMENT_SCREENING_STALE":
    return "This round has changed. Refresh this round and retry.";
  }
 }
 return "Result was not applied. Refresh this round and try again.";
}

export function roundApplyPreviewToken(roundId:string,rows:readonly RoundApplyRow[]){
 const identity=rows.map(x=>[x.resultId,x.applicationId,x.status,x.outcome,x.version]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
 return createHash("sha256").update(JSON.stringify([roundId,identity])).digest("hex");
}
