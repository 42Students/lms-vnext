import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { issuePlacementOffer } from "@/modules/placements/offer-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { applicationId } =
      params;
const offer =
      await issuePlacementOffer(
        context,
        applicationId,
        await readTpoBulkRequestBody(request),
      );
return NextResponse.json(
      { offer },
      { status: 201 },
    );
} catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},{
      status:error.status,headers:{"Cache-Control":"private, no-store"},
    });
    return apiErrorResponse(error);
  }
  },
);
