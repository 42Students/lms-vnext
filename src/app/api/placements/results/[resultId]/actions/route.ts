import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { applyPlacementRoundResultInputSchema } from "@/modules/placements/validation";
import { applyPlacementRoundResult } from "@/modules/placements/result-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { resultId } = params;
    applyPlacementRoundResultInputSchema.parse(
      await boundedRequestJson(request),
    );
    const result =
      await applyPlacementRoundResult(
        context,
        resultId,
      );
    return NextResponse.json({ result });
  },
);
