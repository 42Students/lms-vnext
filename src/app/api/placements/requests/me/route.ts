import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementRequests } from "@/modules/placements/request-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const requests =
      await listOwnPlacementRequests(
        context,
      );
    return NextResponse.json({ requests });
  },
);
