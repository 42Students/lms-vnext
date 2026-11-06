import { route } from "@/security/route";
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const path = params;
    const query = parseFacultyCsvDownloadUrl(request.url,{
      kind:path.kind,assessmentId:path.assessmentId,
    });
    const {csv,filename,omittedRows} = await getFacultyReportCsvForDownload(context,query);
    const headers=new Headers(facultyCsvAttachmentHeaders(filename));
    headers.set("X-Export-Truncated",omittedRows>0?"true":"false");
    headers.set("X-Export-Omitted-Rows",String(omittedRows));
    return new Response("\uFEFF" + csv,{
      status:200,headers,
    });
  },
);
