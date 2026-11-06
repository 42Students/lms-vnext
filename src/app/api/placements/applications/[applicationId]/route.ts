import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getPlacementApplication } from "@/modules/placements/application-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { applicationId } = params;
    const application =
      await getPlacementApplication(
        context,
        applicationId,
      );
    return NextResponse.json({ application });
  },
);
