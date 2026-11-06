import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementRequests } from "@/modules/placements/request-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
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
export const GET = secured(handleGET);
