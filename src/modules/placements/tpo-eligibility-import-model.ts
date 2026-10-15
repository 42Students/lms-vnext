import {z} from "zod";
export const eligibilityImportRowSchema=z.object({studentCode:z.string().trim().min(1).max(80),decision:z.enum(["ELIGIBLE","INELIGIBLE"]),reason:z.string().trim().max(500).default("")}).strict();
export function previewEligibilityImport(rows:readonly z.input<typeof eligibilityImportRowSchema>[],roster:readonly {studentCode:string;membershipId:string}[]){
 const members=new Map(roster.map(r=>[r.studentCode.trim().toLowerCase(),r.membershipId]));const seen=new Set<string>();
 return rows.map((raw,index)=>{const parsed=eligibilityImportRowSchema.safeParse(raw);if(!parsed.success)return {index,status:"unusable" as const,reason:"Invalid row",membershipId:null};
 const row=parsed.data,key=row.studentCode.toLowerCase();if(seen.has(key))return {index,status:"unusable" as const,reason:"Duplicate student",membershipId:null};seen.add(key);
 const id=members.get(key);if(!id)return {index,status:"unusable" as const,reason:"Not in batch",membershipId:null};
 if(row.decision==="INELIGIBLE"&&row.reason.length<3)return {index,status:"unusable" as const,reason:"Reason required",membershipId:null};
 return {index,status:"matched" as const,reason:null,membershipId:id};});
}
