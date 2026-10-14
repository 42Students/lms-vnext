import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { readCollegeActivityExportParams } from "@/modules/activity/college-activity-export-model";
import { exportSuperAdminActivity } from "@/modules/activity/super-admin-audit-export-service";
export const runtime="nodejs";
export async function GET(request:Request) {
 try {
  const params=readCollegeActivityExportParams(new URL(request.url).searchParams);
  const result=await exportSuperAdminActivity(await getCurrentRequestContext(),params);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="super-admin-activity-ist.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
  }});
 }catch(error){return apiErrorResponse(error);}
}
