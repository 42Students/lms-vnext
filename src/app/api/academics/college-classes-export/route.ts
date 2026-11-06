import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { exportCollegeClasses } from "@/modules/academics/college-classes-export-service";
import { readClassesExportParams } from "@/modules/academics/college-classes-export-model";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const filters = readClassesExportParams(new URL(request.url).searchParams);
    const result = await exportCollegeClasses(await getCurrentRequestContext(), filters);
    return new Response(result.csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="classes.csv"',
      "Cache-Control": "private, no-store",
      "X-Export-Truncated": String(result.truncated),
      "X-Export-Row-Cap": String(result.cap),
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return apiErrorResponse(error); }
}
export const GET = secured(handleGET, { stepUp: true });
