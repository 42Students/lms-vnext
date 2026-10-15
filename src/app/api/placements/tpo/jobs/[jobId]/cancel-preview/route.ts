import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { cancelTpoDriveWithPreview } from "@/modules/placements/tpo-drive-cancel-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { jobId } = await params;
    return NextResponse.json(
      await cancelTpoDriveWithPreview(
        await getCurrentRequestContext(),
        jobId,
        await request.json(),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
