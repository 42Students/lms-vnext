import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getFacultyReportCsvForDownload } from "@/modules/courses/faculty-report-csv-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{kind:string;assessmentId:string}>;
};

/** Read-only export. POST/PUT state changes are not accepted by this route. */
export async function GET(request:Request,{params}:RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const path = await params;
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const {csv,filename} = await getFacultyReportCsvForDownload(context,{
      ...query,kind:path.kind,assessmentId:path.assessmentId,
    });
    return new Response("\uFEFF" + csv,{
      status:200,
      headers:{
        "Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="' + filename + '"',
        "Cache-Control":"private, no-store, max-age=0",
        "X-Content-Type-Options":"nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
