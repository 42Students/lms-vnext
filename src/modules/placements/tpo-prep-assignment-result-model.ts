/**
 * Turn the authoritative INSERT ... RETURNING membership IDs into a truthful,
 * deterministic assignment receipt. Existing assignments and ineligible
 * learners are never counted as new work or re-notified on retries.
 */
export type TpoPrepAssignmentStatus="assigned"|"duplicate"|"skipped";
export type TpoPrepAssignmentResult={id:string;status:TpoPrepAssignmentStatus};
export type TpoPrepAssignmentReceipt={
 results:TpoPrepAssignmentResult[];
 counts:{assigned:number;duplicate:number;skipped:number};
};

export function summarizeTpoPrepAssignment(
 selected:readonly string[],eligible:ReadonlySet<string>,inserted:ReadonlySet<string>,
):TpoPrepAssignmentReceipt{
 const results:TpoPrepAssignmentResult[]=selected.map(id=>({
  id,status:!eligible.has(id)?"skipped":inserted.has(id)?"assigned":"duplicate",
 }));
 return {results,counts:{
  assigned:results.filter(row=>row.status==="assigned").length,
  duplicate:results.filter(row=>row.status==="duplicate").length,
  skipped:results.filter(row=>row.status==="skipped").length,
 }};
}
