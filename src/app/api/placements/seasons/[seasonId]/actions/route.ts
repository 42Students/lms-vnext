import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { closePlacementSeason } from "@/modules/placements/season-service";
import { placementSeasonActionInputSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    seasonId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const input =
      placementSeasonActionInputSchema.parse(
        await request.json(),
      );
    const { seasonId } = await params;

    if (input.action === "CLOSE") {
      const season =
        await closePlacementSeason(
          context,
          seasonId,
        );
      return NextResponse.json({ season });
    }

    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
