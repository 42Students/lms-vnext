import { z } from "zod";
import { parseTpoImportCsvRecords } from "./tpo-import-csv-parser";

export const tpoSheetRowSchema=z.object({
  studentCode:z.string().trim().max(128),
  decision:z.enum(["ELIGIBLE","INELIGIBLE","NOT_DECIDED"]),
  reason:z.string().trim().max(200).default(""),
}).strict();
export const tpoSheetInputSchema=z.object({rows:z.array(tpoSheetRowSchema).min(1).max(5000)}).strict();
export type TpoSheetRow=z.infer<typeof tpoSheetRowSchema>;

function heading(value:string) {return value.trim().toLowerCase().replace(/[^a-z0-9]/g,"");}
export function parseTpoEligibilitySheetCsv(source:string):TpoSheetRow[] {
  const records=parseTpoImportCsvRecords(source,5001);
  if(!records.length)throw new Error("No student records found.");
  const headers=records[0].map(heading);
  const match=(choices:string[])=>headers.findIndex(item=>choices.includes(item));
  const codeColumn=match(["studentcode","rollno","rollnumber","regdno","regno","usn","studentid","membershipid"]);
  const decisionColumn=match(["decision","status","outcome","eligibility","eligible"]);
  const reasonColumn=match(["reason","comment","comments","remarks","note"]);
  const withHeader=codeColumn>=0&&decisionColumn>=0;
  const body=withHeader?records.slice(1):records;
  if(!body.length||body.length>5000)throw new Error("Import between 1 and 5000 students.");
  const normalized=(value:string)=>{
    const name=value.trim().toUpperCase().replace(/[-\s]+/g,"_");
    if(["Y","YES","TRUE","ELIGIBLE"].includes(name))return "ELIGIBLE";
    if(["N","NO","FALSE","INELIGIBLE"].includes(name))return "INELIGIBLE";
    if(["","NOT_DECIDED","UNDECIDED","CLEAR","INHERIT","RESET"].includes(name))return "NOT_DECIDED";
    throw new Error("Decision must be Eligible, Ineligible or Not decided");
  };
  return body.map((cells,index)=>{
    const studentCode=cells[withHeader?codeColumn:0]?.trim()??"";
    const decision=normalized(cells[withHeader?decisionColumn:1]??"");
    const reason=cells[withHeader?reasonColumn:2]?.trim()??"";
    const result=tpoSheetRowSchema.safeParse({studentCode,decision,reason});
    if(!result.success)throw new Error("Invalid student decision on row "+(index+1));
    return result.data;
  });
}
export function previewTpoEligibilitySheet(rows:readonly TpoSheetRow[],
  roster:readonly {studentCode:string;membershipId:string;expectedVersion:string;rollNumber?:string|null}[]){
  const normalize=(v:string)=>v.trim().toLowerCase();
  const byId=new Map(roster.map(person=>[normalize(person.membershipId),person]));
  const byRoll=new Map<string,typeof roster[number][]>();
  for(const person of roster)if(person.rollNumber?.trim()){
    const key=normalize(person.rollNumber);
    byRoll.set(key,[...(byRoll.get(key)??[]),person]);
  }
  const seen=new Set<string>(),seenMembers=new Set<string>();
  return rows.map((row,index)=>{
    const key=normalize(row.studentCode);
    if(!key)return {index,status:"unusable" as const,reason:"Roll number is missing",membershipId:null,expectedVersion:null};
    if(seen.has(key))return {index,status:"unusable" as const,reason:"Roll number appears twice",membershipId:null,expectedVersion:null};
    seen.add(key);
    const found=byId.has(key)?[byId.get(key)!]:byRoll.get(key)??[];
    if(found.length!==1)return {index,status:"unusable" as const,
      reason:found.length?"Roll number appears twice":"No student with this roll number",membershipId:null,expectedVersion:null};
    const match=found[0];
    if(seenMembers.has(match.membershipId))return {index,status:"unusable" as const,reason:"Roll number appears twice",membershipId:null,expectedVersion:null};
    seenMembers.add(match.membershipId);
    if(row.decision==="INELIGIBLE" && row.reason.length<3)
      return {index,status:"unusable" as const,reason:"Ineligible needs a reason",membershipId:null,expectedVersion:null};
    return {index,status:"matched" as const,reason:null,membershipId:match.membershipId,expectedVersion:match.expectedVersion};
  });
}
