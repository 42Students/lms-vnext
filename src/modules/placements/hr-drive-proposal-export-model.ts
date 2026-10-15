/** Sanitized metadata only; private proposal descriptions and message bodies are excluded. */
export type HrProposalCsvRow={referenceId:string;title:string;createdAt:Date};
function csvCell(value:string|number){
 const raw=String(value);
 const safe=/^[=+@\-\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function hrDriveProposalHistoryCsv(rows:readonly HrProposalCsvRow[]){
 const columns=["proposal_reference","role_title","sent_at_utc","status"];
 const body=rows.map(row=>[
  row.referenceId,row.title,row.createdAt.toISOString(),"DISCUSSION_ONLY",
 ]);
 return [columns.map(csvCell).join(","),...body.map(row=>row.map(csvCell).join(","))].join("\r\n")+"\r\n";
}
