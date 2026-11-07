import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { exportSuperAdminUsers } from "@/modules/people/admin-users-export-service";
import { readSuperAdminPeopleExportParams } from "@/modules/people/admin-users-export-model";
export const runtime = "nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    await requireRecentDeviceAuthentication(context.user.id);
    const query=readSuperAdminPeopleExportParams(new URL(request.url).searchParams);
    const data=await exportSuperAdminUsers(context,query);
    return new Response(data.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="super-admin-people-ist.csv"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "X-Export-Row-Cap":String(data.cap),"X-Export-Truncated":String(data.truncated),
  }});
  },
);
