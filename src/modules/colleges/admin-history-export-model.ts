/** SA-tenants-modules-17: formula-safe, bounded, currently visible admin history. */
export type AdminHistoryExportRow={occurredAt:Date;eventType:string;summary:string};
function cell(input:string){
 const safe=/^\s*[=+\-@\t\r]/.test(input)?"'"+input:input;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function collegeAdminHistoryCsv(rows:readonly AdminHistoryExportRow[]){
 const head=["When (IST)","Event type","Summary"];
 const out=rows.map(row=>[
  new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.occurredAt),
  row.eventType,row.summary,
 ]);
 return "\uFEFF"+[head,...out].map(record=>record.map(cell).join(",")).join("\r\n")+"\r\n";
}
