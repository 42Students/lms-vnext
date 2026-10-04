import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const journey =
      await getLearnerPlacementJourney(
        context,
      );
    return NextResponse.json({ journey });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
