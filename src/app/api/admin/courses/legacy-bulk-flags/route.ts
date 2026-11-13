import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {updateLegacyCourseBulkFlags} from "@/modules/courses/legacy-course-bulk-flags-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const parsed=await readBoundedJsonRequest(request,16384);
    if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const result=await updateLegacyCourseBulkFlags(
   __ctx,parsed.value);
    return Response.json(result,{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
