import {z} from "zod";
export const eligibilityImportRowSchema=z.object({
 studentCode:z.string().uuid(),decision:z.enum(["ELIGIBLE","INELIGIBLE"]),
 reason:z.string().trim().max(200).default(""),
}).strict();
export const eligibilityImportInputSchema=z.object({
 rows:z.array(eligibilityImportRowSchema).min(1).max(200),
}).strict();
/** CSV accepts membership UUID, ELIGIBLE/INELIGIBLE, reason.
 * Reject quoted/multiline CSV until an audited standards parser is available. */
export function parseTpoEligibilityCsv(text:string){
 if(text.length>50000)throw Error("File is too large");
 const lines=text.trim().split(/\r?\n/).filter(Boolean);
 if(lines.length>201)throw Error("Maximum 200 student records");
 const body=lines[0]?.toLowerCase().replace(/\s/g,"")==="studentcode,decision,reason"?lines.slice(1):lines;
 const rows=body.map((line,index)=>{
  if(line.includes('"')||line.split(",").length!==3)throw Error("Invalid CSV format at row "+(index+1));
  const [studentCode,decision,reason]=line.split(",");
  return eligibilityImportRowSchema.parse({studentCode:studentCode.trim(),decision:decision.trim(),reason:reason.trim()});
 });
 return eligibilityImportInputSchema.parse({rows}).rows;
}
export function previewEligibilityImport(rows:readonly z.infer<typeof eligibilityImportRowSchema>[],
 roster:readonly {studentCode:string;membershipId:string;expectedVersion:string}[]){
 const members=new Map(roster.map(r=>[r.studentCode.trim().toLowerCase(),r]));
 const seen=new Set<string>();
 return rows.map((row,index)=>{
  const key=row.studentCode.toLowerCase();
  if(seen.has(key))return {index,status:"unusable" as const,reason:"Duplicate student ID",membershipId:null,expectedVersion:null};
  seen.add(key);
  const member=members.get(key);
  if(!member)return {index,status:"unusable" as const,reason:"Not an active learner in this batch",membershipId:null,expectedVersion:null};
  if(row.decision==="INELIGIBLE"&&row.reason.length<3)
   return {index,status:"unusable" as const,reason:"Ineligible reason required",membershipId:null,expectedVersion:null};
  return {index,status:"matched" as const,reason:null,membershipId:member.membershipId,expectedVersion:member.expectedVersion};
 });
}
