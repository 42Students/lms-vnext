import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementApplications } from "@/modules/placements/application-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const applications =
      await listOwnPlacementApplications(context);
    return NextResponse.json({ applications });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
