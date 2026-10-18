import {z} from "zod";
import {collegeContactsQuerySchema,contactDateWindowValid,contactAcademicFiltersCompatible,contactRoleAudienceCompatible} from "./college-contacts-model";
import type {CollegeContactRow} from "./college-contacts-service";
export const CONTACT_EXPORT_LIMIT=1000;
export const collegeContactsExportSchema=collegeContactsQuerySchema.omit({page:true,pageSize:true});
export function assertCollegeContactExportFilters(filter:z.infer<typeof collegeContactsExportSchema>):void {
 if(!contactDateWindowValid(filter)||!contactAcademicFiltersCompatible(filter)||!contactRoleAudienceCompatible(filter))
  throw new Error("INVALID_CONTACT_EXPORT");
}
export function parseCollegeContactsExportParams(params:URLSearchParams){
 const input:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)throw new Error("INVALID_CONTACT_EXPORT");
  input[key]=params.get(key)??"";
 }
 const parsed=collegeContactsExportSchema.parse(input);
 assertCollegeContactExportFilters(parsed);
 return parsed;
}
export function neutralizeContactCell(value:string){
 const safe=/^[=+@-]/u.test(value.replace(/^[\s\p{Cc}\p{Cf}\p{Mn}]*/u, ""))?"'"+value:value;
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

/** Offset pages may overlap under concurrent membership changes; never duplicate a person in CSV. */
export function appendUniqueContactExportRows(rows:CollegeContactRow[],page:readonly CollegeContactRow[]):void{
 const seen=new Set(rows.map(row=>row.membershipId));
 for(const row of page){
  if(rows.length>=CONTACT_EXPORT_LIMIT)break;
  if(!seen.has(row.membershipId)){seen.add(row.membershipId);rows.push(row);}
 }
}
