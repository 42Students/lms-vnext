import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  decideTpoLearnerParticipation,
  TpoParticipationConflictError,
} from "@/modules/placements/tpo-participation-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { membershipId } = params;
const result = await decideTpoLearnerParticipation(
      context, membershipId, await boundedRequestJson(request),
    );
return NextResponse.json(result, {
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
} catch (error) {
    if (error instanceof TpoParticipationConflictError) {
      return NextResponse.json(
        { error: "PARTICIPATION_DECISION_CHANGED" },
        { status: 409 },
      );
    }
    return apiErrorResponse(error);
  }
  },
);
