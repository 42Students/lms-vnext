import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {superAdminHiringReportQuery,hiringCompanyRollups} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {placementReportCsv} from "@/modules/placements/report-model";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";

/** Match the legacy four-section export while keeping the authenticated,
 * read-only server download and its bounded selected-college report scope. */
export async function GET(request:Request){
 try{
  const searchParams=new URL(request.url).searchParams;
  const paramKeys=[...searchParams.keys()];
  if(new Set(paramKeys).size!==paramKeys.length)
   return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const parsed=superAdminHiringReportQuery.safeParse(Object.fromEntries(searchParams));
  if(!parsed.success)return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const data=await getSuperAdminCompanyHiringReport(await getCurrentRequestContext(),parsed.data);
  const groups=hiringCompanyRollups(data.rows);
  const rows:(string|number)[][]=[["Hiring Report Summary"]];
  const summaryKeys=[
   ["Total Applications","totalApplications"],
   ["Applied","applied"],
   ["Shortlisted","shortlisted"],
   ["Assessment","assessment"],
   ["Interview","interview"],
   ["Offered","offered"],
   ["Hired","hired"],
   ["Rejected","rejected"],
   ["Withdrawn","withdrawn"],
   ["Waitlisted","waitlisted"],
  ] as const;
  for(const [label,key] of summaryKeys){
   rows.push([label,data.rows.reduce((sum,row)=>sum+row[key],0)]);
  }
  rows.push([],["Hiring Funnel"],["Stage","Count"]);
  const funnelLabels=[
   ["Applied","applied"],
   ["Shortlisted","shortlisted"],
   ["Assessment","assessment"],
   ["Interview","interview"],
   ["Offered","offered"],
   ["Hired","hired"],
  ] as const;
  for(const [label,key] of funnelLabels){
   rows.push([label,data.funnelRows.reduce((sum,row)=>sum+row[key],0)]);
  }
  rows.push([],
   ["Company-wise Report (per-job rows only; see Company Totals section below for rollups)"],
   ["Company","Job","Applied","Shortlisted","Assessment","Interview","Offered","Hired","Rejected","Total Applications","Withdrawn","Waitlisted"]);
  for(const row of data.rows){
   rows.push([row.companyName,row.jobTitle,row.applied,row.shortlisted,row.assessment,
    row.interview,row.offered,row.hired,row.rejected,row.totalApplications,row.withdrawn,row.waitlisted]);
  }
  if(groups.length){
   rows.push([],["Company Totals"],
    ["Company","Applied","Shortlisted","Assessment","Interview","Offered","Hired","Rejected","Total Applications","Withdrawn","Waitlisted"]);
   for(const row of groups){
    rows.push([row.companyName,row.applied,row.shortlisted,row.assessment,row.interview,
     row.offered,row.hired,row.rejected,row.totalApplications,row.withdrawn,row.waitlisted]);
   }
  }
  if(data.truncated)rows.push([],["TRUNCATED: report limited to 5000 drives"]);
  const date=new Date().toISOString().slice(0,10);
  return new Response("\uFEFF"+placementReportCsv(rows[0]!.map(String),rows.slice(1)),{
   headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="hiring-report-'+date+'.csv"',
    "Cache-Control":"private, no-store",
    "X-Export-Truncated":data.truncated?"true":"false",
   },
  });
 }catch(error){return apiErrorResponse(error);}
}
