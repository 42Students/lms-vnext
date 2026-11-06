import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnAppliedPlacementResults } from "@/modules/placements/result-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
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
export const GET = secured(handleGET);
