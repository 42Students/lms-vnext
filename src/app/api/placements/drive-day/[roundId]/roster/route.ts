import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getDriveDayRoster } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { roundId } = await params;
    const roster = await getDriveDayRoster(
      context,
      roundId,
    );
    return NextResponse.json({ roster });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
