import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listMyDriveDayRounds } from "@/modules/placements/drive-day-coordinator-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const context =
      await getCurrentRequestContext();
    const rounds =
      await listMyDriveDayRounds(context);
    return NextResponse.json({ rounds });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);
