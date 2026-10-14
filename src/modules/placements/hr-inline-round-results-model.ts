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
