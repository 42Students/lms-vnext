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

export async function PUT(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const result = await decideTpoLearnerParticipation(
      context, membershipId, await request.json(),
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
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
}
