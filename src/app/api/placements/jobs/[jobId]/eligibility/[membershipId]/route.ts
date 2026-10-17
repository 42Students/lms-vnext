import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {z} from "zod";
import {
  evaluatePlacementEligibility,
  revokeEligibilityOverride,
  setEligibilityOverride,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
    membershipId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId, membershipId } = await params;
    const eligibility =
      await evaluatePlacementEligibility(
        context,
        jobId,
        membershipId,
      );
    return NextResponse.json({ eligibility });
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
    const { jobId, membershipId } = await params;
    const override = await setEligibilityOverride(
      context,
      jobId,
      membershipId,
      await request.json(),
    );
    return NextResponse.json({ override });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
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
    const { jobId, membershipId } = await params;
    const raw=request.headers.get("content-type")?.startsWith("application/json")
      ?await request.json():{};
    const options=z.object({
      expectedOverrideId:z.string().uuid().optional(),
      reason:z.string().trim().min(3).max(500).optional(),
    }).strict().parse(raw);
    const override =
      await revokeEligibilityOverride(
        context,
        jobId,
        membershipId,
        options,
      );
    return NextResponse.json({ override });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
