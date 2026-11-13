import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreGlobalCompany} from "@/modules/placements/super-admin-company-restore-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    return Response.json(await restoreGlobalCompany(__ctx,parsed.value),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
