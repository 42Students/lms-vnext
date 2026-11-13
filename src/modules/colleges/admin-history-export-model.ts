import { spreadsheetCsvCell } from "@/security/csv-cell";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** SA-tenants-modules-17: formula-safe, bounded, currently visible admin history. */
export type AdminHistoryExportRow={occurredAt:Date;eventType:string;summary:string};
const cell=spreadsheetCsvCell;
const indiaTimestamp = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: DEFAULT_TIME_ZONE,
});
export const MAX_ADMIN_HISTORY_EXPORT_ROWS=100;
export function collegeAdminHistoryCsv(rows:readonly AdminHistoryExportRow[]){
 const head=["When (IST)","Event type","Summary"];
 const out=rows.slice(0,MAX_ADMIN_HISTORY_EXPORT_ROWS).map(row=>[
  indiaTimestamp.format(row.occurredAt),
  row.eventType,row.summary,
 ]);
 if(rows.length>MAX_ADMIN_HISTORY_EXPORT_ROWS)
  out.push(["","EXPORT TRUNCATED",
   "Only the first 100 visible administrator history events were exported."]);
 return "\uFEFF"+[head,...out].map(record=>record.map(cell).join(",")).join("\r\n")+"\r\n";
}
