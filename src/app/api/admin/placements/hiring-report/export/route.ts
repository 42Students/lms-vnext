import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {superAdminHiringReportQuery,hiringCompanyRollups} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {placementReportCsv,placementReportCsvCell} from "@/modules/placements/report-model";
import {apiErrorResponse} from "@/lib/api-error";

export const runtime="nodejs";

/** Read-only selected-college or organization export with the legacy summary, funnel,
 * company/job rows and company totals as separate CSV sections. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const keys=[...params.keys()];
  if(new Set(keys).size!==keys.length)
   return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const parsed=superAdminHiringReportQuery.safeParse(Object.fromEntries(params));
  if(!parsed.success)
   return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const data=await getSuperAdminCompanyHiringReport(await getCurrentRequestContext(),parsed.data);
  const groups=hiringCompanyRollups(data.rows);
  const stages=["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const;
  const funnelStages=["applied","shortlisted","assessment","interview","offered","hired"] as const;
  // Headline totals cover every eligible filtered drive, independently of
  // the bounded per-job CSV. Never silently undercount a large college.
  const summary:(string|number)[][]=[
   ["Total Applications",data.fullTotals.totalApplications],
   ...stages.slice(1).map(stage=>[
    stage.charAt(0).toUpperCase()+stage.slice(1),
    data.fullTotals[stage],
   ]),
  ];
  if(data.fullShortlistMeanHours!==null)
   summary.push(["Avg. time to shortlist (hrs)",data.fullShortlistMeanHours]);
  const funnel:(string|number)[][]=funnelStages.map(stage=>[
   stage.charAt(0).toUpperCase()+stage.slice(1),
   data.fullFunnelTotals[stage],
  ]);
  const visibleStages=["applied","shortlisted","assessment","interview","offered","hired","rejected"] as const;
  const companyRows:(string|number)[][]=data.rows.map(row=>[
   row.companyName,row.jobTitle,...visibleStages.map(stage=>row[stage]),
  ]);
  const companyTotals:(string|number)[][]=groups.map(row=>[
   row.companyName,...visibleStages.map(stage=>row[stage]),
  ]);
  const jobColumns=["Company","Job","Applied","Shortlisted","Assessment","Interview","Offered","Hired","Rejected"];
  const totalColumns=jobColumns.filter(column=>column!=="Job");
  // Keep the legacy section names and delimit individual sections with a blank row.
  // Use the shared formula-safe CSV encoder for imported employer and job names.
  const section=(title:string,body:string)=>placementReportCsvCell(title)+"\r\n"+body;
  const csv=[
   section("Hiring Report Summary",summary.map(row=>row.map(placementReportCsvCell).join(",")).join("\r\n")),
   section("Hiring Funnel",placementReportCsv(["Stage","Count"],funnel)),
   section("Company-wise Report (per-job rows only; see Company Totals section below for rollups)",
    placementReportCsv(jobColumns,companyRows)),
   ...(companyTotals.length?[section("Company Totals",placementReportCsv(totalColumns,companyTotals))]:[]),
   ...(data.truncated?[placementReportCsv(["Report Note"],[["PARTIAL JOB BREAKDOWN: company/job rows limited to 5000 drives; headline and funnel totals include all matching drives"]])]:[]),
  ].join("\r\n\r\n");
  const date=new Date().toISOString().slice(0,10);
  return new Response("\uFEFF"+csv,{
   headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="hiring-report-'+date+'.csv"',
    "Cache-Control":"private, no-store",
    "X-Export-Truncated":data.truncated?"true":"false",
   },
  });
 }catch(error){
  return apiErrorResponse(error);
 }
}
