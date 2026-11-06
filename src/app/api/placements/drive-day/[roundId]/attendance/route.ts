import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { markDriveDayAttendance } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    let body: Awaited<ReturnType<Request["json"]>>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const attendance =
      await markDriveDayAttendance(
        context,
        roundId,
        body,
      );
    return NextResponse.json({ attendance });
  },
);
