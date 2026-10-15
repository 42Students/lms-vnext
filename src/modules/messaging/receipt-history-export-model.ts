import {projectMessagingHistory,type MessagingHistoryRow} from "./receipt-history-model";
function cell(value:string|number){
 const raw=String(value);
 const safe=/^[=+@\-\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** Aggregate-only CSV; individual contacts/opaque recipient keys are never exported. */
export function messagingHistoryCsv(rows:readonly MessagingHistoryRow[],total:number){
 const head=["batch_id","purpose","total","queued","provider_accepted","failed","suppressed","finalized","created_at"];
 const body=projectMessagingHistory(rows).map(row=>[
  row.id,row.purpose,row.total,row.queued,row.acceptedByProvider,row.failed,row.suppressed,
  row.finalizedAt?"yes":"no",row.createdAt.toISOString()
 ]);
 return [head.map(cell).join(","),...body.map(row=>row.map(cell).join(",")),
  ["export_rows",body.length,"matching_total",total].map(cell).join(",")].join("\r\n")+"\r\n";
}
