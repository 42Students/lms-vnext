import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      ) ?? "";
    const operations =
      await getPlacementTpoOperations(
        context,
        collegeId,
      );
    return NextResponse.json({ operations });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
