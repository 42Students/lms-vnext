import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getOwnAcademicEvidence,
  upsertOwnAcademicEvidence,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const evidence = await getOwnAcademicEvidence(context);
    return NextResponse.json({ evidence });
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
    const evidence = await upsertOwnAcademicEvidence(
      context,
      await request.json(),
    );
    return NextResponse.json({ evidence });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
