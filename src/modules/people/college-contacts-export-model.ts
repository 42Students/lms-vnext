import {z} from "zod";
import {collegeContactsQuerySchema} from "./college-contacts-model";
import type {CollegeContactRow} from "./college-contacts-service";
export const CONTACT_EXPORT_LIMIT=1000;
export const collegeContactsExportSchema=collegeContactsQuerySchema.omit({page:true,pageSize:true});
export function parseCollegeContactsExportParams(params:URLSearchParams){
 const input:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)throw new Error("INVALID_CONTACT_EXPORT");
  input[key]=params.get(key)??"";
 }
 return collegeContactsExportSchema.parse(input);
}
export function neutralizeContactCell(value:string){
 const safe=/^[\s\u0000-\u001f]*[=+@-]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function renderCollegeContactCsv(rows:readonly CollegeContactRow[],truncated:boolean){
 const header=["Name","Roles","Email (learner masked)","Phone (masked)","Status","Joined (IST)"];
 const format=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"});
 const lines=[header.map(neutralizeContactCell).join(",")];
 for(const row of rows.slice(0,CONTACT_EXPORT_LIMIT)){
  lines.push([row.name,row.roles.join("; "),row.email,row.phone,row.status,format.format(row.joinedAt)]
   .map(neutralizeContactCell).join(","));
 }
 if(truncated||rows.length>CONTACT_EXPORT_LIMIT)lines.push(["EXPORT TRUNCATED","First 1,000 matching contacts","","","",""].map(neutralizeContactCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
