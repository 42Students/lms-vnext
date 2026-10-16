import type {AccreditationStudentRow} from "./tpo-accreditation-students-model";
export const REQUIRED_ACCREDITATION_FIELDS=[
 ["name","Name"],["rollNumber","Roll no."],["programme","Programme"],
 ["branch","Branch"],["batch","Batch"],["employer","Employer"],
 ["packageInr","Package (best offer)"],
] as const;
export function accreditationStudentCompleteness(rows:readonly AccreditationStudentRow[]){
 const absent=REQUIRED_ACCREDITATION_FIELDS.map(([key,label])=>({
  key,label,missing:rows.filter(row=>row[key]===null||
   typeof row[key]==="string"&&row[key].trim()==="").length,
 }));
 return {total:rows.length,missingStudents:rows.filter(row=>
  REQUIRED_ACCREDITATION_FIELDS.some(([key])=>row[key]===null||
   typeof row[key]==="string"&&row[key].trim()==="")).length,fields:absent};
}
