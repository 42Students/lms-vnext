import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { evaluatePlacementEligibility } from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    await requireLearnerPlacementAccess(context);
    const { jobId } = params;
    const eligibility =
      await evaluatePlacementEligibility(
        context,
        jobId,
      );
    return NextResponse.json({ eligibility });
  },
);
