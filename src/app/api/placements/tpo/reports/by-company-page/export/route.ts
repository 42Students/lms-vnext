import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {hasMembershipRole} from "@/modules/identity/context";
import {apiErrorResponse} from "@/lib/api-error";
import {getPlacementReportWorkspace} from "@/modules/placements/report-service";
import {companyReportViewSchema,paginateCompanyReport} from "@/modules/placements/tpo-company-report-view-model";
import {tpoVisibleCompanyReportCsv} from "@/modules/placements/tpo-company-page-csv-model";
import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO")){
   return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
  }
  const params=new URL(request.url).searchParams;
  if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json(
   {error:"INVALID_REPORT_FILTERS"},
   {status:400,headers:{"Cache-Control":"private, no-store"}});
  const parsed=companyReportViewSchema.safeParse({
   q:params.get("q")??"",outcome:params.get("outcome")??"ALL",sort:params.get("sort")??"NAME",page:params.get("page")??1,
  });
  if(!parsed.success)return NextResponse.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const workspace=await getPlacementReportWorkspace(context,{
   collegeId:context.membership.collegeId,
   seasonId:params.get("seasonId")||undefined,jobId:params.get("jobId")||undefined,
  });
  const view=paginateCompanyReport(workspace.report.byCompany,parsed.data);
  const all=params.get("all");
  if(all!==null&&all!=="1")return NextResponse.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const rows=all==="1"
   ? Array.from({length:view.totalPages},(_,i)=>paginateCompanyReport(
       workspace.report.byCompany,{...parsed.data,page:i+1}).rows).flat()
   : view.rows;
  return new Response("\uFEFF"+tpoVisibleCompanyReportCsv(rows),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="' + gridExportFilename(all==="1"?"tpo-company-report-filtered":"tpo-company-report-visible-page", "csv") + '"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
