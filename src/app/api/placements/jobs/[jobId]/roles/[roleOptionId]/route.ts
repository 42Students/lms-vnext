import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archivePlacementRoleOption,
  updatePlacementRoleOption,
} from "@/modules/placements/role-option-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
    roleOptionId: string;
  }>;
};

export async function PATCH(
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
    const { jobId, roleOptionId } =
      await params;
    const role =
      await updatePlacementRoleOption(
        context,
        jobId,
        roleOptionId,
        await request.json(),
      );
    return NextResponse.json({ role });
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
    const context =
      await getCurrentRequestContext();
    const { jobId, roleOptionId } =
      await params;
    const role =
      await archivePlacementRoleOption(
        context,
        jobId,
        roleOptionId,
      );
    return NextResponse.json({ role });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
