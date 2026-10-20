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
  const rows:(string|number)[][]=[
   ...data.rows.map(row=>[row.companyName,row.jobTitle,...keys.map(key=>row[key])]),
   ...groups.map(row=>[row.companyName,"Company total",...keys.map(key=>row[key])]),
  ];
  if(data.truncated)rows.push(["TRUNCATED: report limited to 5000 drives","","","","","","","","","","",""]);
  const date=new Date().toISOString().slice(0,10);
  return new Response("\uFEFF"+placementReportCsv(COMPANY_HIRING_COLUMNS,rows),{
   headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="hiring-report-'+date+'.csv"',
    "Cache-Control":"private, no-store",
    "X-Export-Truncated":data.truncated?"true":"false",
   },
  });
 }catch(e){return apiErrorResponse(e);}
}
