import {z} from "zod";
export const unplacedFilteredExportQuerySchema=z.object({
 seasonId:z.uuid().optional(),jobId:z.uuid().optional(),
 batchId:z.uuid().optional(),branchId:z.uuid().optional(),
}).strict();
export type UnplacedFilteredCsvRow={
 displayName:string;rollNumber:string|null;batch:string;branch:string;
 applications:number;stillInDrive:boolean;lastApplied:string|null;
 lowestRecordedPercent:string;undergraduatePercent:string;marksVerified:string;
};
function escapeCell(value:unknown){
 const data=String(value??"");
 const safe=/^\s*[=+\-@\t\r]/.test(data)?"'"+data:data;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** No sensitive raw notes/identifiers, spreadsheet formulas or unbounded columns. */
export function tpoUnplacedFilteredCsv(rows:readonly UnplacedFilteredCsvRow[]){
 const columns=["Student","Roll no.","Batch","Branch","Lowest recorded %","UG %","Marks verified","Applications","Still in a drive","Last applied (IST)"];
 const lines=rows.map(row=>[
  row.displayName,row.rollNumber,row.batch,row.branch,row.lowestRecordedPercent,row.undergraduatePercent,row.marksVerified,
  row.applications,row.stillInDrive?"Yes":"No",row.lastApplied??"Not recorded",
 ].map(escapeCell).join(","));
 return [columns.map(escapeCell).join(","),...lines].join("\r\n")+"\r\n";
}
