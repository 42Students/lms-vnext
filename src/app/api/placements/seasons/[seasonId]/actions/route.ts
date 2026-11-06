import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { closePlacementSeason } from "@/modules/placements/season-service";
import { placementSeasonActionInputSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const input =
      placementSeasonActionInputSchema.parse(
        await request.json(),
      );
    const { seasonId } = params;
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
  },
);
