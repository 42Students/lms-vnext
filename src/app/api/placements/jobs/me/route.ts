import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const jobs = await listLearnerPlacementJobs(
      context,
    );
    return NextResponse.json({ jobs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
