import {z} from "zod";
export const HR_ROUND_OUTCOMES = ["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"] as const;
export type HrRoundOutcome = typeof HR_ROUND_OUTCOMES[number];
export type HrRoundCount = {
  all:number; recorded:number; unrecorded:number; pass:number; fail:number; hold:number; absent:number;
};
/** Construct UI filters from the scoped, already-validated result projection. */
export function hrInlineRoundResultFilters(counts?:HrRoundCount) {
 return HR_ROUND_OUTCOMES.map(value => ({
   value,
   label:value === "ALL" ? "All" : value === "UNRECORDED" ? "Not recorded" :
     value.charAt(0) + value.slice(1).toLowerCase(),
   count:counts ? counts[value.toLowerCase() as keyof HrRoundCount] : 0,
 }));
}
export function hrInlineRoundResultsHref(jobId:string,roundId:string,outcome:HrRoundOutcome) {
  const params=new URLSearchParams({tab:"rounds",roundId});
  if(outcome!=="ALL") params.set("outcome",outcome);
  return "/hr/placements/jobs/"+encodeURIComponent(jobId)+"?"+params.toString();
}

/** A legacy ResultsRequest had arbitrary rows and numeric applicant IDs.
 * Require explicit, college-scoped application crosswalks before writing;
 * never treat an untrusted old integer as a vNext membership UUID. */
export const hrInlineRoundResultRowSchema=z.strictObject({
 applicationId:z.uuid(),
 outcome:z.enum(["PASS","FAIL","HOLD","ABSENT"]),
 note:z.string().trim().max(2000).nullable().optional(),
});
export const hrInlineRoundResultsRowsSchema=z.array(
 hrInlineRoundResultRowSchema,
).min(1).max(1000).superRefine((rows,context)=>{
 const seen=new Set<string>();
 rows.forEach((row,index)=>{
  if(seen.has(row.applicationId))context.addIssue({
   code:"custom",path:[index,"applicationId"],
   message:"Select each applicant only once per round.",
  });
  seen.add(row.applicationId);
 });
});
export const hrLegacyRoundResultRowSchema=z.strictObject({
 applicantId:z.number().int().positive(),
 status:z.enum(["PASS","FAIL","HOLD","ABSENT"]),
 note:z.string().trim().max(2000).nullable().optional(),
});
export type HrInlineRoundResultRow=z.infer<typeof hrInlineRoundResultRowSchema>;
/** Caller must supply a verified mapping obtained from a scoped recruiter
 * applicants read; missing/duplicated IDs reject the entire batch. */
export function resolveLegacyHrRoundRows(
 raw:unknown,applicationIdsByLegacyApplicantId:ReadonlyMap<number,string>,
):HrInlineRoundResultRow[]{
 const input=z.array(hrLegacyRoundResultRowSchema).min(1).max(1000).parse(raw);
 const rows=input.map(row=>{
  const applicationId=applicationIdsByLegacyApplicantId.get(row.applicantId);
  if(!applicationId)throw new Error("Recruiter applicant ID has no scoped application mapping.");
  return {applicationId,outcome:row.status,note:row.note??null};
 });
 return hrInlineRoundResultsRowsSchema.parse(rows);
}
