import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getFacultyReportCsvForDownload } from "@/modules/courses/faculty-report-csv-service";
import {
  facultyCsvAttachmentHeaders,
  parseFacultyCsvDownloadUrl,
} from "@/modules/courses/faculty-report-csv-request";

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
    const query = parseFacultyCsvDownloadUrl(request.url,{
      kind:path.kind,assessmentId:path.assessmentId,
    });
    const {csv,filename} = await getFacultyReportCsvForDownload(context,query);
    return new Response("\uFEFF" + csv,{
      status:200,
      headers:facultyCsvAttachmentHeaders(filename),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
