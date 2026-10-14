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
    return new Response(result.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="college-activity.csv"',
        "Cache-Control": "private, no-store",
        "X-Export-Truncated": String(result.truncated),
        "X-Export-Row-Cap": String(result.cap),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return apiErrorResponse(error); }
}
