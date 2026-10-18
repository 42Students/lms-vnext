import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { recordTpoOfferLifecycle } from "@/modules/placements/tpo-offer-lifecycle-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    return NextResponse.json(
      await recordTpoOfferLifecycle(context, jobId, await readTpoBulkRequestBody(request)),
    );
  } catch (error) {
    if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
      {status:error.status,headers:{"Cache-Control":"private, no-store"}});
    return apiErrorResponse(error);
  }
}
