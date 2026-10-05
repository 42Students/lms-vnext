import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { removeDriveDayCoordinator } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
    assignmentId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId, assignmentId } =
      await params;
    const assignment =
      await removeDriveDayCoordinator(
        context,
        jobId,
        assignmentId,
      );
    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
