import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {confirmOwnPlacementRound} from "@/modules/placements/learner-round-confirmation-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const body=await boundedRequestJson(request) as unknown;
    const result=await confirmOwnPlacementRound(__ctx,body);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
