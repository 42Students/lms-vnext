import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getPlacementEvaluationConfig,
  replacePlacementEvaluationConfig,
} from "@/modules/placements/evaluation-config-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const config =
      await getPlacementEvaluationConfig(
        context,
        jobId,
      );
    return NextResponse.json({ config });
  },
);

export const PUT = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const config =
      await replacePlacementEvaluationConfig(
        context,
        jobId,
        await request.json(),
      );
    return NextResponse.json({ config });
  },
);
