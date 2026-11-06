import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {
  getOwnAcademicEvidence,
  upsertOwnAcademicEvidence,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    await requireLearnerPlacementAccess(context);
    const evidence = await getOwnAcademicEvidence(context);
    return NextResponse.json({ evidence });
  },
);

export const PUT = route(
  { auth: "user", permission: "actor-owned" },
  async ({ request, context: actor }) => {
    const context = actor!;
    await requireLearnerPlacementAccess(context);
    const evidence = await upsertOwnAcademicEvidence(
      context,
      await request.json(),
    );
    return NextResponse.json({ evidence });
  },
);
