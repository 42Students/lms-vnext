import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getLearnerProfileWithRuntime,
  upsertLearnerProfileWithRuntime,
} from "@/modules/people/runtime";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

async function handleGET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const profile = await getLearnerProfileWithRuntime(
      context,
      membershipId,
    );

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const profile = await upsertLearnerProfileWithRuntime(
      context,
      membershipId,
      body,
    );

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PUT = secured(handlePUT);
