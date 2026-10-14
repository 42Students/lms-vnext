import {z} from "zod";
import {superAdminReadQuerySchema, type SuperAdminReadQuery, type SuperAdminReadRow} from "./super-admin-read-directory-model";
export const SUPER_ADMIN_SCOPED_CSV_CAP=250;
export const superAdminScopedCsvQuerySchema=superAdminReadQuerySchema.omit({page:true});
export function parseSuperAdminScopedCsvParams(params:URLSearchParams){
 const raw:Record<string,string|string[]>={};
 for(const key of params.keys()){
  const values=params.getAll(key);
  raw[key]=values.length===1?values[0]:values;
 }
 return superAdminScopedCsvQuerySchema.parse(raw);
}
export function superAdminScopedCsvHref(path:string,query:Pick<SuperAdminReadQuery,"q"|"status">){
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.status!=="ALL")params.set("status",query.status);
 return path+(params.size?"?"+params.toString():"");
}
function csvCell(value:string){
 const neutral=/^\s*[=+@\-\t\r]/.test(value)?"'"+value:value;
 return '"'+neutral.replaceAll('"','""')+'"';
}
export function buildSuperAdminScopedCsv(rows:readonly SuperAdminReadRow[],truncated:boolean){
 const columns=["Record ID","Name","Context","Status","Additional persisted fields"];
 const lines=[columns.map(csvCell).join(",")];
 for(const row of rows.slice(0,SUPER_ADMIN_SCOPED_CSV_CAP)){
  lines.push([row.id,row.title,row.subtitle,row.status,row.details.join(" | ")].map(csvCell).join(","));
 }
 if(truncated||rows.length>SUPER_ADMIN_SCOPED_CSV_CAP){
  lines.push(["EXPORT TRUNCATED",`First ${SUPER_ADMIN_SCOPED_CSV_CAP} matching records only. Narrow filters for remaining rows.`,"","",""].map(csvCell).join(","));
 }
 return "\ufeff"+lines.join("\r\n")+"\r\n";
}
export function scopedCsvStatusAllowed(status:string,allowed:readonly string[]){return allowed.includes(status);}
