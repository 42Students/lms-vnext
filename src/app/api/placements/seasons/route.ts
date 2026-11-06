import { route } from "@/security/route";
import { NextResponse } from "next/server";
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

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const requestUrl = new URL(request.url);
    const collegeId = requestUrl.searchParams.get("collegeId");
    const activeCollegeId=context.membership?.collegeId??context.adminScope?.collegeId;
    const scopedCollegeId=collegeId ?? activeCollegeId ?? "";
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
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const season =
      await createPlacementSeason(
        context,
        await request.json(),
      );
    return NextResponse.json(
      { season },
      { status: 201 },
    );
  },
);
