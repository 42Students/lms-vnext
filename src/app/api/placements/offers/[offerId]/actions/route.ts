import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { placementOfferActionSchema } from "@/modules/placements/validation";

import { ROLE } from "@/modules/identity/roles";
import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
// The old offer response API requires a literal JSON boolean. Do not
// coerce "true", 1 or null; an extra action must not override this decision.
const legacyOfferResponseSchema=z.strictObject({
  accept:z.boolean(),
  reason:z.string().trim().min(1).max(2000).nullable().optional(),
});

type RouteContext = {
  params: Promise<{ offerId: string }>;
};

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { offerId } = params;
const raw=await readTpoBulkRequestBody(request);
let actionInput:unknown=raw;
if(typeof raw==="object"&&raw!==null&&!Array.isArray(raw)){
      const source=raw as Record<string,unknown>;
      if("accept" in source){
        // One canonical strict schema for both legacy and vNext callers:
        // malformed or contradictory decision payloads receive HTTP 400.
        const legacy=legacyOfferResponseSchema.parse(source);
        actionInput={
          action:legacy.accept?"ACCEPT":"DECLINE",
          ...(!legacy.accept&&legacy.reason!==undefined?{reason:legacy.reason}:{}),
        };
      }
    }
const offer =
      await actOnPlacementOffer(
        context,
        offerId,
        placementOfferActionSchema.parse(actionInput),
        new Date(),
        context.membership?.roles.includes(ROLE.LEARNER) ? "ISSUED" : undefined,
      );
return NextResponse.json({offer,status:offer?.status},
      {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":CACHE.PRIVATE},
    });
    return apiErrorResponse(error);
  }
  },
);
