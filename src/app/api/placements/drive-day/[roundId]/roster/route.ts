import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getDriveDayRoster } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const roster = await getDriveDayRoster(
      context,
      roundId,
    );
    return NextResponse.json({ roster });
  },
);
