import {createHash} from "node:crypto";
import {z} from "zod";
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
/** Never send PostgreSQL errors, credentials or permission internals in per-learner result reports. */
export function roundApplyFailureReason(_error:unknown):string{
 return "Result was not applied. Refresh this round and try again.";
}

export function roundApplyPreviewToken(roundId:string,rows:readonly RoundApplyRow[]){
 const identity=rows.map(x=>[x.resultId,x.applicationId,x.status,x.outcome,x.version]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
 return createHash("sha256").update(JSON.stringify([roundId,identity])).digest("hex");
}
