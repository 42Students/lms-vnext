import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  revokeSuperAdminHrCollegeAccess,
} from "@/modules/placements/super-admin-hr-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
    grantId: string;
  }>;
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

    const {
      userId,
      grantId,
    } = await params;

    const grant =
      await revokeSuperAdminHrCollegeAccess(
        context,
        userId,
        grantId,
      );

    return NextResponse.json({ grant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
