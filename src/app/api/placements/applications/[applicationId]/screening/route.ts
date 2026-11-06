import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPlacementScreening } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { applicationId } = params;
    const screening =
      await getPlacementScreening(
        context,
        applicationId,
      );
    return NextResponse.json({ screening });
  },
);
