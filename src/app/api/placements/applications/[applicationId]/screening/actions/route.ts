import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { decidePlacementScreening } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { applicationId } = params;
    const screening =
      await decidePlacementScreening(
        context,
        applicationId,
        await boundedRequestJson(request),
      );
    return NextResponse.json({ screening });
  },
);
