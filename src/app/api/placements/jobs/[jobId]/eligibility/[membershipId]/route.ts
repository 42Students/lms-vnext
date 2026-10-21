import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getPlacementJob} from "@/modules/placements/job-service";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
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
    // A direct eligibility read exposes student academic evidence and
    // effective overrides. Recheck the current TPO/College Admin membership
    // before accepting a job ID from a stale browser session.
    const { jobId, membershipId } = await params;
    if(isSuperAdmin(context)){
      // A globally privileged role is not a license to read student evidence
      // outside its explicitly selected and still-active acting college.
      const acting=await resolveActingCollege(context,"placements.manage");
      const job=await getPlacementJob(context,jobId);
      if(job.collegeId!==acting.collegeId)
        throw new AuthorizationError("placements.manage");
    }else{
      await requireTpoBatchActor(context);
    }
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
