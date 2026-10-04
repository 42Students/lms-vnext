import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context =
      await getCurrentRequestContext();
    const jobs =
      await listOwnRecruiterPlacementJobs(
        context,
      );
    return NextResponse.json({ jobs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
