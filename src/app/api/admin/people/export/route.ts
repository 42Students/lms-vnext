import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { exportSuperAdminUsers } from "@/modules/people/admin-users-export-service";
import { readSuperAdminPeopleExportParams } from "@/modules/people/admin-users-export-model";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";
export const GET = route(
  { auth: "user", permission: "people.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    await requireRecentDeviceAuthentication(context.user.id);
    const query=readSuperAdminPeopleExportParams(new URL(request.url).searchParams);
    const data=await exportSuperAdminUsers(context,query);
    return new Response(data.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader("super-admin-people-ist.csv"),
   "Cache-Control":CACHE.PRIVATE,"X-Content-Type-Options":"nosniff",
   "X-Export-Row-Cap":String(data.cap),"X-Export-Truncated":String(data.truncated),
  }});
  },
);
