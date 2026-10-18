/** SA-tenants-modules-17: formula-safe, bounded, currently visible admin history. */
export type AdminHistoryExportRow={occurredAt:Date;eventType:string;summary:string};
function cell(input:string){
 // Spreadsheet importers can strip invisible format and combining marks
 // before deciding whether a value starts with a formula operator.
 const visible=input.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
 const safe= (/^[\t\r]/u.test(input)||/^[-=+@]/u.test(visible))?"'"+input:input;
 return '"'+safe.replaceAll('"','""')+'"';
}
export const MAX_ADMIN_HISTORY_EXPORT_ROWS=100;
export function collegeAdminHistoryCsv(rows:readonly AdminHistoryExportRow[]){
 const head=["When (IST)","Event type","Summary"];
 const out=rows.slice(0,MAX_ADMIN_HISTORY_EXPORT_ROWS).map(row=>[
  new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.occurredAt),
  row.eventType,row.summary,
 ]);
 if(rows.length>MAX_ADMIN_HISTORY_EXPORT_ROWS)
  out.push(["","EXPORT TRUNCATED",
   "Only the first 100 visible administrator history events were exported."]);
 return "\uFEFF"+[head,...out].map(record=>record.map(cell).join(",")).join("\r\n")+"\r\n";
}
