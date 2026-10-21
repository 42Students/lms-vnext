import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {superAdminHiringReportQuery,hiringCompanyRollups,COMPANY_HIRING_COLUMNS} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {placementReportCsv} from "@/modules/placements/report-model";
import {apiErrorResponse} from "@/lib/api-error";

export const runtime="nodejs";

/** Read-only selected-college export with the legacy summary, funnel,
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
  const summary:(string|number)[][]=[
   ["Companies",groups.length],
   ["Drives",data.rows.length],
   ...stages.map(stage=>[stage,data.rows.reduce((total,row)=>total+row[stage],0)]),
  ];
  const funnel:(string|number)[][]=funnelStages.map(stage=>[
   stage,data.funnelRows.reduce((total,row)=>total+row[stage],0),
  ]);
  const companyRows:(string|number)[][]=data.rows.map(row=>[
   row.companyName,row.jobTitle,...stages.map(stage=>row[stage]),
  ]);
  const companyTotals:(string|number)[][]=groups.map(row=>[
   row.companyName,"Company total",...stages.map(stage=>row[stage]),
  ]);
  const csv=[
   placementReportCsv(["Hiring Report Summary","Value"],summary),
   placementReportCsv(["Hiring Funnel","Count"],funnel),
   placementReportCsv([...COMPANY_HIRING_COLUMNS],companyRows),
   placementReportCsv([...COMPANY_HIRING_COLUMNS],companyTotals),
   ...(data.truncated?[
    placementReportCsv(["Report Note"],[["TRUNCATED: report limited to 5000 drives"]]),
   ]:[]),
  ].join("\r\n");
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
