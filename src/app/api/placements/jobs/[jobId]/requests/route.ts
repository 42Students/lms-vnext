import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listPlacementJobRequests } from "@/modules/placements/request-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;
    const requests =
      await listPlacementJobRequests(
        context,
        jobId,
      );
    return NextResponse.json({ requests });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
