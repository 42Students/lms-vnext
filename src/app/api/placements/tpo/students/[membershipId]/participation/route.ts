import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  decideTpoLearnerParticipation,
  TpoParticipationConflictError,
} from "@/modules/placements/tpo-participation-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { membershipId } = params;
    const result = await decideTpoLearnerParticipation(
      context, membershipId, await request.json(),
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  },
);
