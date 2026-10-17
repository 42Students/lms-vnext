import {placementReportCsv} from "./report-model";
import type {getCollegeHiringFunnel} from "./college-hiring-funnel-service";

export function collegeHiringFunnelCsv(data:Awaited<ReturnType<typeof getCollegeHiringFunnel>>){
 const stages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED",
 "OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
 const headers=["Company","Job","Total Applications",...stages];
 const rows=data.companyRows.map(row=>[
  row.company,row.job,row.total,...stages.map(stage=>row.byStage[stage]??0),
 ]);
 rows.push(["TOTAL","All drives",data.totalApplications,
  ...stages.map(stage=>data.totals[stage]??0)]);
 return "\uFEFF"+placementReportCsv(headers,rows);
}
