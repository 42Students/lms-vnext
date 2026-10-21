import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { placementOfferActionSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

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
      if(typeof source.accept==="boolean"&&source.action===undefined){
        // Old learner offer response {accept:boolean}. We deliberately retain
        // the typed server permission, offer UUID and issued-state CAS checks.
        const {accept,reason,...rest}=source;
        actionInput={...rest,action:accept?"ACCEPT":"DECLINE",
          ...(!accept&&typeof reason==="string"?{reason}:{})};
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
