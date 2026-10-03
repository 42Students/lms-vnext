import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCandidatePreferences,
  upsertCandidatePreferences,
} from "@/modules/placements/candidate-preferences-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const preferences =
      await getCandidatePreferences(context);
    return NextResponse.json({ preferences });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const preferences =
      await upsertCandidatePreferences(
        context,
        body,
      );
    return NextResponse.json({ preferences });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
