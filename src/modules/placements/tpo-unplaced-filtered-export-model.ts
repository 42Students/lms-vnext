import {z} from "zod";
export const unplacedFilteredExportQuerySchema=z.object({
 seasonId:z.uuid().optional(),jobId:z.uuid().optional(),
 batchId:z.uuid().optional(),branchId:z.uuid().optional(),
}).strict();
export type UnplacedFilteredCsvRow={
 displayName:string;rollNumber:string|null;batch:string;branch:string;
 applications:number;stillInDrive:boolean;
};
function escapeCell(value:unknown){
 const data=String(value??"");
 const safe=/^\s*[=+\-@\t\r]/.test(data)?"'"+data:data;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** No sensitive raw notes/identifiers, spreadsheet formulas or unbounded columns. */
export function tpoUnplacedFilteredCsv(rows:readonly UnplacedFilteredCsvRow[]){
 const columns=["Student","Roll no.","Batch","Branch","Applications","Still in a drive"];
 const lines=rows.map(row=>[
  row.displayName,row.rollNumber,row.batch,row.branch,row.applications,row.stillInDrive?"Yes":"No",
 ].map(escapeCell).join(","));
 return [columns.map(escapeCell).join(","),...lines].join("\r\n")+"\r\n";
}
