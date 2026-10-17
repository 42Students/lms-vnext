import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "./tpo-audit-model";
import type {TpoAuditRow} from "./tpo-audit-service";

/** Export only the same allowlisted fields displayed by the TPO audit UI. */
function csvCell(value:string){
 const text=/^[=+@\-\t\r]/.test(value)? "'"+value:value;
 return '"'+text.replaceAll('"','""')+'"';
}
export function tpoAuditCsv(rows:readonly TpoAuditRow[]){
 const header=["Event","About","Detail","Actor","When"];
 const lines=rows.map(row=>[
  formatTpoAuditEventType(row.eventType),
  TPO_AUDIT_KIND_LABELS[row.kind],
  [row.title,row.detail].filter(Boolean).join(" · "),
  row.actorName,
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(row.occurredAt))+" IST",
 ].map(csvCell).join(","));
 return [header.map(csvCell).join(","),...lines].join("\r\n")+"\r\n";
}
