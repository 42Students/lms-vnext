import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {duplicateCollegeDrive} from "@/modules/placements/college-drive-clone-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params,ctx=__ctx;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    return Response.json(await duplicateCollegeDrive(ctx,jobId,parsed.value),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
