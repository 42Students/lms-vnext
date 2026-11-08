import { spreadsheetCsvCell } from "@/security/csv-cell";
import {z} from "zod";
export const companyEngagementCsvQuerySchema=z.object({
 seasonId:z.uuid().optional(),jobId:z.uuid().optional(),
 companyId:z.uuid().optional(),
}).strict();
export type CompanyEngagementCsvRow={
 companyName:string;contacts:number;invited:number;joined:number;drives:number;placed:number;
};
/** Formula-safe, BOM-ready Excel CSV. */
export function companyEngagementCsv(rows:readonly CompanyEngagementCsvRow[]){
 const headings=["Company","Contacts","Invited","Joined","Recorded drives (selected scope)","Students placed (selected scope)"];
 return [headings,...rows.map(row=>[row.companyName,row.contacts,row.invited,row.joined,row.drives,row.placed])]
  .map(row=>row.map(spreadsheetCsvCell).join(",")).join("\r\n")+"\r\n";
}
