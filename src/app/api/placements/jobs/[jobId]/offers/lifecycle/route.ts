import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
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
      await recordTpoOfferLifecycle(context, jobId, await request.json()),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
