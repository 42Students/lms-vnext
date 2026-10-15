/** Current-page authorized learner membership IDs only; blank decisions require deliberate operator choice. */
export function buildTpoEligibilityImportScaffold(rows:readonly {membershipId:string}[]):string{
 const ids=[...new Set(rows.map(row=>row.membershipId))];
 return "studentCode,decision,reason\r\n"+ids.map(id=>id+",,").join("\r\n")+(ids.length?"\r\n":"");
}
export function tpoEligibilityImportScaffoldHref(batchId:string,page:number):string{
 return "/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/students/import-scaffold?page="+page;
}
