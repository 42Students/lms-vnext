import "server-only";

import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { onboardPersonWithRuntime, upsertFacultyProfileWithRuntime } from "./runtime";
import { tokenizeStudentCsv } from "./college-student-csv-model";

export const FACULTY_CSV_COLUMNS =
  ["First Name","Last Name","Mobile Number","Email","Faculty Type"] as const;
const requestSchema = z.object({
  action: z.enum(["PREVIEW","IMPORT"]),
  csv: z.string().min(1).max(1000000),
  confirm: z.boolean().optional(),
}).strict().refine(value=>value.action==="PREVIEW"||value.confirm===true,{
  path:["confirm"],message:"Confirm registration before importing",
});
type CsvFacultyRow = {
  displayName:string;phoneE164:string;email:string;employmentType:string;
};
type FacultyImportResult = {row:number;status:"VALID"|"INVALID"|"IMPORTED"|"FAILED"|"PARTIAL";detail:string;membershipId?:string};

export async function runCollegeFacultyCsv(context:RequestContext,raw:unknown) {
  const input=requestSchema.parse(raw);
  const member=context.membership;
  if(!member||member.status!=="ACTIVE")throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context,"people.manage",{
    collegeId:member.collegeId,organizationId:member.organizationId,
  });
  let rows:string[][];
  try { rows=tokenizeStudentCsv(input.csv.replace(/^\uFEFF/,"")); }
  catch {
    return {preview:true,valid:0,invalid:0,structuralErrors:["INVALID_CSV_FORMAT"],
      results:[] as FacultyImportResult[]};
  }
  if(rows.length===0||rows[0]?.map(cell=>cell.trim()).join(",")!==FACULTY_CSV_COLUMNS.join(",")){
    return {preview:true,valid:0,invalid:0,structuralErrors:["INVALID_CSV_HEADER"],
      results:[] as FacultyImportResult[]};
  }
  if(rows.length-1>500)return {preview:true,valid:0,invalid:0,
    structuralErrors:["ROW_LIMIT_EXCEEDED"],results:[] as FacultyImportResult[]};
  const seenPhones=new Set<string>(),seenEmails=new Set<string>();
  const entries=rows.slice(1).map((row,index)=>{
    const errors:string[]=[];
    const name=[row[0]?.trim(),row[1]?.trim()].filter(Boolean).join(" ");
    const phone=(row[2]?.trim()??"").replace(/^([0-9]{10})$/,"+91$1");
    const email=row[3]?.trim()??"";
    const employmentType=row[4]?.trim()??"";
    if(row.length!==5)errors.push("COLUMN_COUNT_MISMATCH");
    if(name.length<2||name.length>255)errors.push("NAME_INVALID");
    if(!/^\+[1-9]\d{7,14}$/.test(phone))errors.push("MOBILE_INVALID");
    if(email&&!z.email().safeParse(email).success)errors.push("EMAIL_INVALID");
    if(employmentType.length>128)errors.push("FACULTY_TYPE_TOO_LONG");
    if(seenPhones.has(phone))errors.push("DUPLICATE_MOBILE_IN_FILE");
    seenPhones.add(phone);
    if(email){
      if(seenEmails.has(email.toLowerCase()))errors.push("DUPLICATE_EMAIL_IN_FILE");
      seenEmails.add(email.toLowerCase());
    }
    const data:CsvFacultyRow={displayName:name,phoneE164:phone,email,employmentType};
    return {row:index+2,data,errors};
  });
  const valid=entries.filter(item=>item.errors.length===0).length;
  const invalid=entries.length-valid;
  if(input.action==="PREVIEW")return {preview:true,valid,invalid,structuralErrors:[],
    results:entries.map(item=>({row:item.row,
      status:item.errors.length?"INVALID" as const:"VALID" as const,
      detail:item.errors.join("; ")||"Ready to register faculty"}))};
  const results:FacultyImportResult[]=[];
  for(const entry of entries){
    if(entry.errors.length){
      results.push({row:entry.row,status:"INVALID",detail:entry.errors.join("; ")});continue;
    }
    let membershipId:string;
    try{
      const person=await onboardPersonWithRuntime(context,{
        collegeId:member.collegeId,displayName:entry.data.displayName,
        phoneE164:entry.data.phoneE164,
        ...(entry.data.email?{email:entry.data.email}:{}),roles:["FACULTY"],
      });
      membershipId=person.membership.id;
    }catch{
      results.push({row:entry.row,status:"FAILED",
        detail:"Faculty identity or membership creation failed. Check before retrying."});continue;
    }
    try{
      await upsertFacultyProfileWithRuntime(context,membershipId,{
        primaryDepartmentId:null, employmentType:entry.data.employmentType||null,academicTitle:null,
      });
      results.push({row:entry.row,status:"IMPORTED",detail:"Faculty registered",membershipId});
    }catch{
      results.push({row:entry.row,status:"PARTIAL",membershipId,
        detail:"Faculty registered, but type/profile update failed. Open Edit Faculty to finish."});
    }
  }
  return {preview:false,valid,invalid,structuralErrors:[],results};
}
