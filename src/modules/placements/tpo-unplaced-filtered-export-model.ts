import { spreadsheetCsvCell } from "@/security/csv-cell";
import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const unplacedFilteredExportQuerySchema=z.object({
 seasonId:zUuid.optional(),jobId:zUuid.optional(),
 batchId:zUuid.optional(),branchId:zUuid.optional(),
}).strict();
export type UnplacedFilteredCsvRow={
 displayName:string;rollNumber:string|null;batch:string;branch:string;
 applications:number;stillInDrive:boolean;lastApplied:string|null;
 lowestRecordedPercent:string;undergraduatePercent:string;marksVerified:string;
};
/** No sensitive raw notes/identifiers, spreadsheet formulas or unbounded columns. */
export function tpoUnplacedFilteredCsv(rows:readonly UnplacedFilteredCsvRow[]){
 const columns=["Student","Roll no.","Batch","Branch","Lowest recorded %","UG %","Marks verified","Applications","Still in a drive","Last applied (IST)"];
 const lines=rows.map(row=>[
  row.displayName,row.rollNumber,row.batch,row.branch,row.lowestRecordedPercent,row.undergraduatePercent,row.marksVerified,
  row.applications,row.stillInDrive?"Yes":"No",row.lastApplied??"Not recorded",
 ].map(spreadsheetCsvCell).join(","));
 return [columns.map(spreadsheetCsvCell).join(","),...lines].join("\r\n")+"\r\n";
}
