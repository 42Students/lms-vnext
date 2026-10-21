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
/** Stage count provenance: current-state snapshot counts and cumulative
 * ever-reached funnel steps have different denominators. Only verified
 * selected-college membership's application rows enter each aggregate.
 * Withdrawn is application status; hired requires accepted offer plus
 * persisted JOINED; stage history preserves cumulative earlier steps.
 * Historical numeric legacy IDs are never inferred from UUIDs.
 */
export const SUPER_ADMIN_HIRING_STAGE_PROVENANCE={
 scope:"SELECTED_COLLEGE_APPLICATIONS",
 snapshot:"CURRENT_STAGE_OR_SCREENING_FALLBACK",
 withdrawn:"PERSISTED_APPLICATION_STATUS",
 hired:"ACCEPTED_OFFER_AND_RECORDED_JOINED",
 funnel:"EVER_REACHED_HISTORY_OR_CURRENT",
 legacyIntegerIdMapping:"NOT_APPLIED",
} as const;
export const COMPANY_HIRING_COLUMNS=["Company","Drive","Total Applications","Applied","Shortlisted","Assessment","Interview","Offered","Hired","Rejected","Withdrawn","Waitlisted"] as const;
export type SuperAdminHiringRow={companyId:string;companyName:string;jobId:string;jobTitle:string;
 totalApplications:number;applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number;rejected:number;withdrawn:number;waitlisted:number};
export function hiringCompanyRollups(rows:readonly SuperAdminHiringRow[]){
 const groups=new Map<string,Omit<SuperAdminHiringRow,"companyId"|"jobId"|"jobTitle">>();
 for(const row of rows){
  let total=groups.get(row.companyId);
  if(!total){total={companyName:row.companyName,totalApplications:0,applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0,rejected:0,withdrawn:0,waitlisted:0};groups.set(row.companyId,total);}
  for(const key of ["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const)total[key]+=row[key];
 }
 return [...groups.values()].sort((a,b)=>a.companyName.localeCompare(b.companyName));
}
