import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";

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
    const offer =
      await actOnPlacementOffer(
        context,
        offerId,
        await readTpoBulkRequestBody(request),
        new Date(),
        context.membership?.roles.includes("LEARNER") ? "ISSUED" : undefined,
      );
    return NextResponse.json({ offer });
  } catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
}
