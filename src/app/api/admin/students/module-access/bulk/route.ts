import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {updateSuperAdminStudentRulesInBulk} from "@/modules/module-access/super-admin-student-bulk-rule-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const command=await readBoundedJsonRequest(request,8192);
    if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    return Response.json(await updateSuperAdminStudentRulesInBulk(
   __ctx,command.value),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
