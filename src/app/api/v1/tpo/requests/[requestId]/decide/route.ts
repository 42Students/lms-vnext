import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {decideLegacyTpoRequest} from "@/modules/placements/tpo-global-requests-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {requestId}=params;
    const _body=await readBoundedJsonRequest(request,8192);
    if(!_body.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const decided=await decideLegacyTpoRequest(
   __ctx,requestId,_body.value);
    return privateJson(decided);
  },
);
