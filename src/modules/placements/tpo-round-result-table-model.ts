import { z } from "zod";
export const tpoRoundResultTableQuerySchema=z.object({
  jobId:z.string().uuid(),roundId:z.string().uuid(),
}).strict();
export type RoundResultEntry={
 applicationId:string;student:string|null;role:string;
 applicationStatus:string;screeningStatus:string|null;
 resultId:string|null;resultStatus:string|null;outcome:string|null;
};
export function projectTpoRoundResultTable(rows:readonly RoundResultEntry[],round:{kind:string;status:string;jobStatus:string}){
 const eligible=rows.filter(row=>row.applicationStatus==="SUBMITTED"&&
   row.screeningStatus==="SHORTLISTED");
 return {
  rows:eligible.map(row=>({...row,
   editable:round.jobStatus==="PUBLISHED"&&round.kind!=="TALK"&&(round.status==="SCHEDULED"||round.status==="COMPLETED")&&
     row.resultStatus!=="APPLIED"})),
  counts:{eligible:eligible.length,
   staged:eligible.filter(row=>row.resultStatus==="STAGED").length,
   applied:eligible.filter(row=>row.resultStatus==="APPLIED").length,
   remaining:eligible.filter(row=>row.resultStatus===null).length},
 };
}
