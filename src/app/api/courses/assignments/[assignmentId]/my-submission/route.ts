import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getMyAssignmentSubmission,
} from "@/modules/courses/assignment-submission-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { assignmentId } = await params;
    const url = new URL(request.url);
    const submission =
      await getMyAssignmentSubmission(
        context,
        assignmentId,
        url.searchParams.get("deliveryId") ??
          "",
      );

    return NextResponse.json({ submission });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
