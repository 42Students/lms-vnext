import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {recruiterCompanyReportsQuerySchema} from "@/modules/placements/recruiter-company-reports-model";
import {getRecruiterCompanyReports} from "@/modules/placements/recruiter-company-reports-service";
import {buildHrCompanyReportCsv,HR_REPORT_EXPORT_CAP} from "@/modules/placements/hr-company-report-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const query=recruiterCompanyReportsQuerySchema.parse({
   collegeId:params.get("collegeId")??undefined,status:params.get("status")??undefined,
   page:1,pageSize:50,
  });
  const context=await getCurrentRequestContext();
  const first=await getRecruiterCompanyReports(context,query);
  if(first.status!=="READY")return NextResponse.json({error:"COLLEGE_SELECTION_REQUIRED"},{status:403});
  const rows=[...first.jobs];
  const pages=Math.min(first.totalPages,Math.ceil(HR_REPORT_EXPORT_CAP/first.pageSize));
  for(let page=2;page<=pages;page++){
   const part=await getRecruiterCompanyReports(context,{...query,page});
   if(part.status!=="READY")return NextResponse.json({error:"COLLEGE_SELECTION_REQUIRED"},{status:403});
   rows.push(...part.jobs);
  }
  const csv=buildHrCompanyReportCsv(rows,first.matchedTotal);
  return new Response(csv.csv,{headers:{"Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-report", "csv") + '"',
   "Cache-Control":"private, no-store","X-Export-Omitted":String(csv.omitted)}});
 }catch(error){return apiErrorResponse(error);}
}
