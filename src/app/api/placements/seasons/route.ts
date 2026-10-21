import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementSeason,
  listPlacementSeasons,
} from "@/modules/placements/season-service";

export const runtime = "nodejs";
/** Scoped legacy TPO season route mapping:
 * GET /api/v1/tpo/season → GET /api/placements/seasons?collegeId={uuid}
 * GET /api/v1/tpo/season/current → /tpo/settings/season
 * POST /api/v1/tpo/season → POST /api/placements/seasons
 * Legacy /{seasonId}/open-registration is intentionally not translated to
 * ACTIVE/CLOSED: registration-open state and deadline are independent fields
 * and must use a separately authorized, persisted registration workflow.
 */
export const TPO_SEASON_LEGACY_CROSSWALK = {
 list: "/api/placements/seasons?collegeId={uuid}",
 current: "/tpo/settings/season",
 create: "/api/placements/seasons",
 openRegistration: "NOT_AVAILABLE_UNTIL_REGISTRATION_LIFECYCLE",
} as const;

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
