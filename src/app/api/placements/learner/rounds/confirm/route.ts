import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {confirmOwnPlacementRound} from "@/modules/placements/learner-round-confirmation-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const body=await boundedRequestJson(request) as unknown;
    const result=await confirmOwnPlacementRound(__ctx,body);
    return privateJson(result);
  },
);
