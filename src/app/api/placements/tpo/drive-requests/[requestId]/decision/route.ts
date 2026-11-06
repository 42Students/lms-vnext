import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
  decideTpoRecruiterDriveRequest,TpoDriveRequestDecisionError,
} from "@/modules/placements/tpo-drive-request-decision-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {requestId}=params;
    const response=await decideTpoRecruiterDriveRequest(
      __ctx,requestId,await request.json(),
    );
    return NextResponse.json(response,{headers:{"Cache-Control":"private, no-store"}});
  },
);
