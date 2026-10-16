import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportParams } from "@/modules/academics/college-lecture-halls-export-model";
import { exportCollegeLectureHalls } from "@/modules/academics/college-lecture-halls-export-service";

export const runtime = "nodejs";
/** SA-academics-people-27: tenant-selected, bounded CSV for Super Admin only. */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    if (!isSuperAdmin(context)) throw new AuthorizationError("academics.manage");
    const result = await exportCollegeLectureHalls(
      context, exportParams(new URL(request.url).searchParams), "superadmin",
    );
    return new Response(result.csv, {headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lecture-halls.csv"',
      "Cache-Control": "private, no-store",
      "X-Export-Truncated": String(result.truncated),
      "X-Export-Row-Cap": String(result.cap),
      "X-Content-Type-Options": "nosniff",
    }});
  } catch(error) { return apiErrorResponse(error); }
}
