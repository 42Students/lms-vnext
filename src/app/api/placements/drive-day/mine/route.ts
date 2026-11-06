import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listMyDriveDayRounds } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    const rounds =
      await listMyDriveDayRounds(context);
    return NextResponse.json({ rounds });
  },
);
