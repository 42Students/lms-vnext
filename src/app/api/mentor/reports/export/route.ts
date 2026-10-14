import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorReports} from "@/modules/projects/mentor-reports-service";
import {mentorReportsQuerySchema,mentorReportsCsv}
  from "@/modules/projects/mentor-reports-model";
export const runtime="nodejs";
/** Only registered current Mentor project state, never learner data. */
export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    const query=mentorReportsQuerySchema.parse({
      status:url.searchParams.get("status")??undefined,
      attention:url.searchParams.get("attention")??undefined,
      assignment:url.searchParams.get("assignment")??undefined,
      search:url.searchParams.get("search")??undefined,page:1,
    });
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
