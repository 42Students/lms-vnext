import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const screening =
      await listPlacementScreeningQueue(
        context,
        jobId,
      );
    return NextResponse.json({ screening });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
