import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnAppliedPlacementResults } from "@/modules/placements/result-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const results =
      await listOwnAppliedPlacementResults(
        context,
      );
    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
