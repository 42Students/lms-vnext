import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveTpoPublicPlacementContent} from "@/modules/placements/public-page/content-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const input:unknown=await boundedRequestJson(request);
    const content=await saveTpoPublicPlacementContent(__ctx,input);
    return NextResponse.json({content});
  },
);
