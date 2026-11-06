import { getCurrentRequestContext } from "@/auth/request-context";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { exportSuperAdminUsers } from "@/modules/people/admin-users-export-service";
import { readSuperAdminPeopleExportParams } from "@/modules/people/admin-users-export-model";
import { secured } from "@/security/secure-handler";
export const runtime = "nodejs";
async function handleGET(request: Request) {
 try {
  const context=await getCurrentRequestContext();
  await requireRecentDeviceAuthentication(context.user.id);
  const query=readSuperAdminPeopleExportParams(new URL(request.url).searchParams);
  const data=await exportSuperAdminUsers(context,query);
  return new Response(data.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="super-admin-people-ist.csv"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "X-Export-Row-Cap":String(data.cap),"X-Export-Truncated":String(data.truncated),
  }});
 } catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
