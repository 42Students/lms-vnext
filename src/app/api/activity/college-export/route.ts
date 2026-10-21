import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  readCollegeActivityExportParams,
} from "@/modules/activity/college-activity-export-model";
import { exportCollegeActivity } from "@/modules/activity/college-activity-export-service";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const params = readCollegeActivityExportParams(new URL(request.url).searchParams);
    const context = await getCurrentRequestContext();
    const result = await exportCollegeActivity(context, params);
    // Legacy exports use activity-{category}-{YYYY-MM-DD}.csv.
    // Category is parsed by the scoped export service; sanitize to prevent
    // arbitrary header/path content in a download filename.
    const category=(params?.category??"all").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,32)||"all";
    const today=new Intl.DateTimeFormat("en-CA",{
      timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    }).format(new Date());
    const filename=`activity-${category}-${today}.csv`;
    return new Response(result.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Export-Truncated": String(result.truncated),
        "X-Export-Row-Cap": String(result.cap),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return apiErrorResponse(error); }
}
