import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementRequests } from "@/modules/placements/request-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context =
      await getCurrentRequestContext();
    const requests =
      await listOwnPlacementRequests(
        context,
      );
    return NextResponse.json({ requests });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
