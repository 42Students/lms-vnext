import { z } from "zod";
export const tpoRoundResultTableQuerySchema=z.object({
  jobId:z.string().uuid(),roundId:z.string().uuid(),
  page:z.number().int().min(1).max(10000).default(1),
}).strict();
export type RoundResultEntry={
 applicationId:string;student:string|null;role:string;rollNumber?:string|null;
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

export const tpoRoundResultViewSchema=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","NOT_RECORDED","STAGED","APPLIED"]).default("ALL"),
}).strict();
export function filterTpoRoundResultRows<T extends {student:string|null;role:string;resultStatus:string|null}>(
 rows:readonly T[],query:z.infer<typeof tpoRoundResultViewSchema>,
){
 const term=query.q.toLocaleLowerCase("en-IN");
 return rows.filter(row=>
  (query.status==="ALL"||(query.status==="NOT_RECORDED"?row.resultStatus===null:row.resultStatus===query.status))&&
  (!term||row.student?.toLocaleLowerCase("en-IN").includes(term)||row.role.toLocaleLowerCase("en-IN").includes(term))
 );
}
