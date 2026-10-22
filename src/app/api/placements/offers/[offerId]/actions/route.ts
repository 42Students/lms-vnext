import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { placementOfferActionSchema } from "@/modules/placements/validation";

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

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { offerId } = await params;
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
        context.membership?.roles.includes("LEARNER") ? "ISSUED" : undefined,
      );
    // vNext clients read {offer}; historical LearnerOfferController returned
    // the offer object directly. Legacy integrations must unwrap response.offer
    // at their adapter boundary; changing this authenticated route would break
    // active clients and does not add server-side security.
    return NextResponse.json({offer,status:offer.status},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
}
