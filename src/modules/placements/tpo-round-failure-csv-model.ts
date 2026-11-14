import { spreadsheetCsvCell } from "@/security/csv-cell";
import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const tpoRoundFailureCsvQuerySchema=z.object({
 seasonId:zUuid.optional(),jobId:zUuid.optional(),
}).strict();
export type TpoRoundFailureCsvRow={
 roundName:string;branchName:string;failed:number;decisions:number;
 shareOfRoundPercent:number|null;
};
/** The CSV is derived from the exact rendered branch-denominator model. */
export function tpoRoundFailureCsv(rows:readonly TpoRoundFailureCsvRow[]){
 const lines=[["Round","Branch (current)","Failed decisions","Applied decisions","Share of recorded round decisions"],
  ...rows.map(row=>[row.roundName,row.branchName,String(row.failed),String(row.decisions),
   row.shareOfRoundPercent===null?"Unavailable":row.shareOfRoundPercent+"%"])];
 return "\uFEFF"+lines.map(row=>row.map(spreadsheetCsvCell).join(",")).join("\r\n")+"\r\n";
}
