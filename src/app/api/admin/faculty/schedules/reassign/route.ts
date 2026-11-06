import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {reassignSuperAdminFacultySchedules,SuperAdminFacultyScheduleReassignError}
  from "@/modules/admin-ui/super-admin-faculty-schedule-reassign-service";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const report=await reassignSuperAdminFacultySchedules(context,parsed.value);
    return Response.json({report},{headers:{"Cache-Control":"private, no-store"}});
  },
);
