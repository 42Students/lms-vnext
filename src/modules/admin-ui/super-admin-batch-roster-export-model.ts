import {z} from "zod";
export const superAdminBatchRosterExportId=z.uuid();
const neutralize=(value:string)=>/^[\s\u0000-\u001f\u00ad\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\uFEFF]*[=+@-]/u.test(value)?"'"+value:value;
function csvCell(value:unknown){
 const text=neutralize(value==null?"":String(value));
 return '"'+text.replace(/"/g,'""')+'"';
}
export function superAdminBatchRosterCsv(rows:readonly {
 name:string|null;roll:string|null;email:string|null;classId:string|null;
}[],classLabels:ReadonlyMap<string,string>){
 const data=[["Student","Roll No.","Email","Current class"],...rows.map(row=>[
  row.name??"",row.roll??"",row.email??"",row.classId?classLabels.get(row.classId)??"Unknown":"Not assigned",
 ])];
 return "\ufeff"+data.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
