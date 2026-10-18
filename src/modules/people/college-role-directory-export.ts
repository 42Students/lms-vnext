import {z} from "zod";
import {collegeRoleDirectoryHref,collegeRoleDirectoryQuerySchema,assertCompatibleCollegeRoleDirectoryFilters,roleDirectoryDateWindowValid,type CollegeDirectoryKind,type CollegeRoleDirectoryQuery,type CollegeRoleDirectoryRow} from "./college-role-directory-model";

export const ROLE_DIRECTORY_EXPORT_LIMIT=1000;
const exportFilterSchema=collegeRoleDirectoryQuerySchema.omit({page:true,pageSize:true});
const exportSchema=exportFilterSchema.extend({kind:z.enum(["FACULTY","LEARNER"])});

export function collegeRoleDirectoryExportHref(kind:CollegeDirectoryKind,filter:CollegeRoleDirectoryQuery):string {
 const url=new URL(collegeRoleDirectoryHref(kind,{...filter,page:1,pageSize:25}),"https://lms.invalid");
 url.searchParams.set("kind",kind);
 return "/api/college/roles/export?"+url.searchParams.toString();
}
export function parseCollegeRoleDirectoryExportQuery(params:URLSearchParams){
 const input:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)throw new Error("INVALID_ROLE_DIRECTORY_EXPORT");
  input[key]=params.get(key)??"";
 }
 const parsed=exportSchema.safeParse(input);
 if(!parsed.success)throw new Error("INVALID_ROLE_DIRECTORY_EXPORT");
 const {kind,...raw}=parsed.data;
 const filter=collegeRoleDirectoryQuerySchema.parse(raw);
 if(!roleDirectoryDateWindowValid(filter))throw new Error("INVALID_ROLE_DIRECTORY_EXPORT");
 try{
  assertCompatibleCollegeRoleDirectoryFilters(kind,filter);
  if(kind==="FACULTY"&&(filter.enrollment!=="ALL"||filter.cohortId||filter.programId||filter.sectionId||filter.classPresence!=="ALL"||filter.registrationPresence!=="ALL"||filter.rollPresence!=="ALL"))throw new Error("INCOMPATIBLE_FACULTY_FILTER");
  if(kind==="LEARNER"&&(filter.teaching!=="ALL"||filter.teachingRole!=="ALL"||filter.facultyDepartmentId||filter.employmentType||filter.titlePresence!=="ALL"||filter.departmentPresence!=="ALL"))throw new Error("INCOMPATIBLE_LEARNER_FILTER");
 }
 catch{throw new Error("INVALID_ROLE_DIRECTORY_EXPORT");}
 return {kind,filter};
}
export function escapeRoleDirectoryCsvCell(value:string):string {
 const safe=/^[\s\p{Cf}\p{Mn}\u0000-\u001f]*[-=+@]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function renderCollegeRoleDirectoryCsv(kind:CollegeDirectoryKind,rows:readonly CollegeRoleDirectoryRow[],truncated:boolean):string {
 const header=["Name","Email","Membership","Platform account","Joined (IST)","Program","Batch","Classes","Active teaching assignments"];
 const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"});
 const lines=[header.map(escapeRoleDirectoryCsvCell).join(",")];
 for(const row of rows.slice(0,ROLE_DIRECTORY_EXPORT_LIMIT)){
  lines.push([
    row.name,row.email??"",row.membershipStatus,row.userStatus,fmt.format(row.joinedAt),
    kind==="LEARNER"?row.program??"": "",
    kind==="LEARNER"?row.cohort??"": "",
    kind==="LEARNER"?row.sections.join("; "):"",
    kind==="FACULTY"?String(row.activeTeachingAssignments):"",
  ].map(escapeRoleDirectoryCsvCell).join(","));
 }
 if(truncated||rows.length>ROLE_DIRECTORY_EXPORT_LIMIT){
  lines.push(["EXPORT TRUNCATED","First 1,000 matching memberships","","","","","","",""].map(escapeRoleDirectoryCsvCell).join(","));
 }
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}

/** Avoid repeated memberships if a live roster shifts between CSV page reads. */
export function appendUniqueRoleExportRows(rows:CollegeRoleDirectoryRow[],page:readonly CollegeRoleDirectoryRow[]):void {
 const seen=new Set(rows.map(row=>row.membershipId));
 for(const row of page){
  if(rows.length>=ROLE_DIRECTORY_EXPORT_LIMIT)break;
  if(!seen.has(row.membershipId)){seen.add(row.membershipId);rows.push(row);}
 }
}
