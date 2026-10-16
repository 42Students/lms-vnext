export type BulkResultLine={leadId:string;status:"updated"|"unchanged"|"ineligible";reason:string|null};
/** Only failure/ineligible rows are suitable for a retry after refreshing state. */
export function tpoBulkFailedLines(items:readonly BulkResultLine[]){
 return items.filter(item=>item.status==="ineligible");
}
export function tpoBulkFailedSummary(items:readonly BulkResultLine[]){
 const failed=tpoBulkFailedLines(items);
 return failed.length===0?"No failed recruiter leads.":
  failed.map(item=>item.leadId+" — "+(item.reason??"State changed; refresh before retrying")).join("\n");
}
