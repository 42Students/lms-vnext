import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getManagedAcademicEvidence,
  upsertVerifiedAcademicEvidence,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ membershipId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { membershipId } = await params;
    const evidence =
      await getManagedAcademicEvidence(
        context,
        membershipId,
      );
    return NextResponse.json({ evidence });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const evidence =
      await upsertVerifiedAcademicEvidence(
        context,
        membershipId,
        await request.json(),
      );
    return NextResponse.json({ evidence });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
