import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { recordPlacementJoiningOutcome } from "@/modules/placements/offer-service";
import { placementJoiningOutcomeInputSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ offerId: string }>;
};

export async function PUT(
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
    const joining =
      await recordPlacementJoiningOutcome(
        context,
        offerId,
        placementJoiningOutcomeInputSchema.parse(await readTpoBulkRequestBody(request)),
      );
    return NextResponse.json({ joining });
  } catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
}
