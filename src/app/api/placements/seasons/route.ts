import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementSeason,
  currentPlacementSeason,
  currentPlacementSeasonCopy,
  listPlacementSeasons,
} from "@/modules/placements/season-service";

export const runtime = "nodejs";
/** Scoped legacy TPO season route mapping:
 * GET /api/v1/tpo/season → GET /api/placements/seasons (optional selected collegeId)
 * GET /api/v1/tpo/season/current → /tpo/settings/season
 * POST /api/v1/tpo/season → POST /api/placements/seasons
 * Legacy /{seasonId}/open-registration uses the independent, scoped
 * registration lifecycle with CAS; ACTIVE alone never opens enrollment.
 */
export const TPO_SEASON_LEGACY_CROSSWALK = {
 list: "/api/placements/seasons?collegeId={uuid}",
 current: "/tpo/settings/season",
 create: "/api/placements/seasons",
 openRegistration: "/api/placements/seasons/{seasonId}/open-registration",
} as const;

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const requestUrl = new URL(request.url);
    const collegeId = requestUrl.searchParams.get("collegeId");
    // The active college x role switcher remains authoritative. Legacy TPO
    // callers may omit collegeId, but never select a foreign tenant by URL.
    const activeCollegeId=context.membership?.collegeId??context.adminScope?.collegeId;
    const scopedCollegeId=collegeId ?? activeCollegeId ?? "";
    // Legacy GET /season/current selected the newest current season, without
    // fetching history. The vNext model calls this ACTIVE; it must never create
    // a default season as a side effect of a read.
    if (requestUrl.searchParams.get("current")==="true") {
      const season=await currentPlacementSeason(context,scopedCollegeId);
      return NextResponse.json({
        season, ...currentPlacementSeasonCopy(season),
        message:season?null:"No seasons created. Create a placement season before opening registration.",
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    const seasons =
      await listPlacementSeasons(context,scopedCollegeId);
    return NextResponse.json({
      seasons,
      empty:seasons.length===0,
      message:seasons.length===0
        ?"No seasons created. Create a placement season before opening registration."
        :null,
    },{headers:{"Cache-Control":"private, no-store"}});
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
