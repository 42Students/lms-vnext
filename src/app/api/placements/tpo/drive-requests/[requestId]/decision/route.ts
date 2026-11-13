import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
  decideTpoRecruiterDriveRequest,TpoDriveRequestDecisionError,
} from "@/modules/placements/tpo-drive-request-decision-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {requestId}=params;
const response=await decideTpoRecruiterDriveRequest(
      __ctx,requestId,await boundedRequestJson(request),
    );
return privateJson(response);
} catch(error){
    if(error instanceof TpoDriveRequestDecisionError)
      return NextResponse.json({error:error.code},{
        status:error.code==="REQUEST_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
  },
);
