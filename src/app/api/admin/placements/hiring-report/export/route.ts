import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import {superAdminHiringReportQuery,hiringCompanyRollups,COMPANY_HIRING_COLUMNS} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {placementReportCsv} from "@/modules/placements/report-model";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const searchParams=new URL(request.url).searchParams;
  // A duplicate appliedFrom, jobId or academic filter is ambiguous and
  // cannot be safely collapsed by Object.fromEntries (last value wins).
  const paramKeys=[...searchParams.keys()];
  if(new Set(paramKeys).size!==paramKeys.length)
    return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const args=Object.fromEntries(searchParams);
  const parsed=superAdminHiringReportQuery.safeParse(args);
  if(!parsed.success)return Response.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const data=await getSuperAdminCompanyHiringReport(await getCurrentRequestContext(),parsed.data);
  const groups=hiringCompanyRollups(data.rows);
  const keys=["totalApplications","applied","shortlisted","assessment","interview","offered","hired","rejected","withdrawn","waitlisted"] as const;
  const totals=Object.fromEntries(keys.map(key=>[key,data.rows.reduce((sum,row)=>sum+row[key],0)]))
    as Record<(typeof keys)[number],number>;
  const summary:(string|number)[][]=[
   ["Companies",groups.length],["Drives",data.rows.length],
   ...keys.map(key=>[key,totals[key]] as [string,number]),
  ];
  const funnelKeys=["applied","shortlisted","assessment","interview","offered","hired"] as const;
  const funnel:(string|number)[][]=funnelKeys.map(key=>[
   key,data.funnelRows.reduce((sum,row)=>sum+row[key],0),
  ]);
  const companyRows=data.rows.map(row=>[row.companyName,row.jobTitle,...keys.map(key=>row[key])]);
  const companyTotals=groups.map(row=>[row.companyName,"Company total",...keys.map(key=>row[key])]);
  const csv=[
   placementReportCsv(["Hiring Report Summary","Value"],summary),
   placementReportCsv(["Hiring Funnel","Count"],funnel),
   placementReportCsv(COMPANY_HIRING_COLUMNS,companyRows),
   placementReportCsv(COMPANY_HIRING_COLUMNS,companyTotals),
   ...(data.truncated?[placementReportCsv(["Report Note"],[["TRUNCATED: report limited to 5000 drives"]])]:[]),
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
 }catch(e){return apiErrorResponse(e);}
}
