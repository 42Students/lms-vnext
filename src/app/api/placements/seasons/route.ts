import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementSeason,
  listPlacementSeasons,
} from "@/modules/placements/season-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const collegeId = new URL(
      request.url,
    ).searchParams.get("collegeId");
    const seasons =
      await listPlacementSeasons(
        context,
        collegeId ?? "",
      );
    return NextResponse.json({ seasons });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const season =
      await createPlacementSeason(
        context,
        await request.json(),
      );
    return NextResponse.json(
      { season },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
