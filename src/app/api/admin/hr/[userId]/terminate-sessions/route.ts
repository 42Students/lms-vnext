import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  terminateSuperAdminHrSessions,
} from "@/modules/placements/super-admin-hr-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { userId } = params;
    const result =
      await terminateSuperAdminHrSessions(
        context,
        userId,
      );
    return NextResponse.json(result);
  },
);
