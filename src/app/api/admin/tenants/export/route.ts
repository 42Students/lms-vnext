import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { readTenantDirectoryExportParams } from "@/modules/colleges/admin-tenant-export-model";
import { exportSuperAdminTenantDirectory } from "@/modules/colleges/admin-tenant-lifecycle-service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const query = readTenantDirectoryExportParams(new URL(request.url).searchParams);
    const result = await exportSuperAdminTenantDirectory(context, query);
    return new Response(result.csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="tenant-directory-ist.csv"',
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      Vary: "Cookie",
      "X-Export-Truncated": String(result.truncated), "X-Export-Row-Cap": String(result.cap),
    } });
  } catch (error) {
    const response=apiErrorResponse(error);
    response.headers.set("Cache-Control","private, no-store");
    response.headers.set("Vary","Cookie");
    return response;
  }
}
