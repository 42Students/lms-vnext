import {z} from "zod";
import {spreadsheetCsvCell} from "@/security/csv-cell";
import { zUuid } from "@/lib/schema-primitives";
export const superAdminBatchRosterExportId=zUuid;
const csvCell = spreadsheetCsvCell;
export function superAdminBatchRosterCsv(rows:readonly {
 name:string|null;roll:string|null;email:string|null;classId:string|null;
}[],classLabels:ReadonlyMap<string,string>){
 const data=[["Student","Roll No.","Email","Current class"],...rows.map(row=>[
  row.name??"",row.roll??"",row.email??"",row.classId?classLabels.get(row.classId)??"Unknown":"Not assigned",
 ])];
 return "\ufeff"+data.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
