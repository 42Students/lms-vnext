import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementRoleOption,
  listPlacementRoleOptions,
} from "@/modules/placements/role-option-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;
    const roles =
      await listPlacementRoleOptions(
        context,
        jobId,
      );
    return NextResponse.json({ roles });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
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
    const { jobId } = await params;
    const role =
      await createPlacementRoleOption(
        context,
        jobId,
        await request.json(),
      );
    return NextResponse.json(
      { role },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
