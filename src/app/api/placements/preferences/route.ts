import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {patchCandidatePreferences} from "@/modules/placements/candidate-preferences-patch-service";
import {
  getCandidatePreferences,
  upsertCandidatePreferences,
} from "@/modules/placements/candidate-preferences-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    await requireLearnerPlacementAccess(context);
    const preferences =
      await getCandidatePreferences(context);
    return NextResponse.json({ preferences });
  },
);

export const PUT = route(
  { auth: "user", permission: "actor-owned" },
  async ({ request, context: actor }) => {
    const context = actor!;
    await requireLearnerPlacementAccess(context);
    const body = await request.json();
    const preferences =
      await upsertCandidatePreferences(
        context,
        body,
      );
    return NextResponse.json({ preferences });
  },
);

/** Conflict-aware partial update, unlike the legacy full-form PUT. */
export const PATCH = route(
  { auth: "user", permission: "actor-owned" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const preferences=await patchCandidatePreferences(context,await request.json());
    return NextResponse.json({preferences},{headers:{"cache-control":"no-store"}});
  },
);
