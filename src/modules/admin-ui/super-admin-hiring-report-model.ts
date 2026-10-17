import {z} from "zod";
export const superAdminHiringReportQuery=z.strictObject({
 q:z.string().trim().max(100).default(""),
 jobId:z.uuid().optional(),
 departmentId:z.uuid().optional(),
 programId:z.uuid().optional(),
 cohortId:z.uuid().optional(),
 appliedFrom:z.iso.date().optional(),
 appliedTo:z.iso.date().optional(),
}).refine(query=>!query.appliedFrom||!query.appliedTo||query.appliedFrom<=query.appliedTo,{
 path:["appliedTo"],message:"End date must not precede start date.",
});
export type SuperAdminHiringReportQuery=z.infer<typeof superAdminHiringReportQuery>;
export const SUPER_ADMIN_HIRING_EXPORT_CAP=5000;
export const COMPANY_HIRING_COLUMNS=["Company","Drive","Applied","Shortlisted","Assessment","Interview","Offered","Hired","Rejected"] as const;
export type SuperAdminHiringRow={companyId:string;companyName:string;jobId:string;jobTitle:string;
 applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number;rejected:number};
export function hiringCompanyRollups(rows:readonly SuperAdminHiringRow[]){
 const groups=new Map<string,{companyName:string;applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number;rejected:number}>();
 for(const row of rows){
  let total=groups.get(row.companyId);
  if(!total){total={companyName:row.companyName,applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0,rejected:0};groups.set(row.companyId,total);}
  for(const key of ["applied","shortlisted","assessment","interview","offered","hired","rejected"] as const)total[key]+=row[key];
 }
 return [...groups.values()].sort((a,b)=>a.companyName.localeCompare(b.companyName));
}
