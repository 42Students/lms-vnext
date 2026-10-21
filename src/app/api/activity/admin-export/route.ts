import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { readCollegeActivityExportParams } from "@/modules/activity/college-activity-export-model";
import { exportSuperAdminActivity } from "@/modules/activity/super-admin-audit-export-service";
export const runtime="nodejs";
export async function GET(request:Request) {
 try {
  const params=readCollegeActivityExportParams(new URL(request.url).searchParams);
  const result=await exportSuperAdminActivity(await getCurrentRequestContext(),params);
  const istDate = new Intl.DateTimeFormat("en-GB", {
   timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()).split("/").reverse().join("-");
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="activity-all-matching-'+istDate+'.csv"',
   "X-Export-Scope": "all-matching-filtered",
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
  }});
 }catch(error){return apiErrorResponse(error);}
}
