import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { evaluatePlacementEligibility } from "@/modules/placements/eligibility-service";

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
    await requireLearnerPlacementAccess(context);
    const { jobId } = await params;
    const eligibility =
      await evaluatePlacementEligibility(
        context,
        jobId,
      );
    return NextResponse.json({ eligibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
