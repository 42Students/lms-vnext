import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { revokePlacementRecruiterGrant } from "@/modules/placements/recruiter-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ grantId: string }>;
};

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
    const context =
      await getCurrentRequestContext();
    const { grantId } = await params;
    const grant =
      await revokePlacementRecruiterGrant(
        context,
        grantId,
      );
    return NextResponse.json({ grant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
