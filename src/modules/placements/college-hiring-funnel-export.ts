import {placementReportCsv} from "./report-model";
import type {getCollegeHiringFunnel} from "./college-hiring-funnel-service";

/**
 * The export mirrors the on-screen summary, funnel and company report, not
 * merely the per-job grid. All values come from the same scoped snapshot,
 * and placementReportCsv escapes formula-leading cells as well as quotes.
 */
export function collegeHiringFunnelCsv(data:Awaited<ReturnType<typeof getCollegeHiringFunnel>>){
 const stages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED",
  "REJECTED","WITHDRAWN","WAITLISTED"] as const;
 const label=(stage:string)=>stage.charAt(0)+stage.slice(1).toLowerCase();
 const rows:Array<Array<string|number|null|undefined>>=[];
 rows.push(["Total Applications",data.totalApplications]);
 for(const stage of stages)rows.push([label(stage),data.totals[stage]??0]);
 if(data.averageHoursToShortlist!=null)
  rows.push(["Avg. time to shortlist (hrs)",Math.round(data.averageHoursToShortlist)]);
 rows.push([],["Hiring Funnel"],["Stage","Count"]);
 for(const stage of stages)rows.push([label(stage),data.totals[stage]??0]);
 rows.push([],["Company-wise Report (per-job rows only; see Company Totals section below for rollups)"]);
 rows.push(["Company","Job",...stages.map(label)]);
 const companies=new Map<string,{company:string;byStage:Record<string,number>}>();
 for(const row of data.companyRows){
  rows.push([row.company,row.job,...stages.map(stage=>row.byStage[stage]??0)]);
  const summary=companies.get(row.company)??{company:row.company,byStage:Object.fromEntries(stages.map(stage=>[stage,0]))};
  for(const stage of stages)summary.byStage[stage]+=(row.byStage[stage]??0);
  companies.set(row.company,summary);
 }
 rows.push([],["Company Totals"],["Company",...stages.map(label)]);
 for(const summary of [...companies.values()].sort((left,right)=>left.company.localeCompare(right.company)))
  rows.push([summary.company,...stages.map(stage=>summary.byStage[stage]??0)]);
 rows.push([],["TOTAL",...stages.map(stage=>data.totals[stage]??0)]);
 return "\uFEFF"+placementReportCsv(["Hiring Report Summary"],rows);
}
