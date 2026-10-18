import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {getMentorReports} from "@/modules/projects/mentor-reports-service";
import {mentorReportsQuerySchema,mentorReportsCsv}
  from "@/modules/projects/mentor-reports-model";
export const runtime="nodejs";
/** Only registered current Mentor project state, never learner data. */
export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,
      ["taskCoverage","status","attention","assignment","order","search"]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
      headers:{"Cache-Control":"private, no-store"}});
    const query=mentorReportsQuerySchema.parse({...filters,page:1});
    const report=await getMentorReports(await getCurrentRequestContext(),query);
    if(!report.enabled)
      return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    return new Response(mentorReportsCsv(report.exportItems,report.exportOmitted),{
      headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-project-reports.csv"',
        "Cache-Control":"private, no-store",
        "X-Export-Omitted":String(report.exportOmitted)},
    });
  }catch(error){return apiErrorResponse(error);}
}
