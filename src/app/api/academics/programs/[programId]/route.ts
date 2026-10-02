import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveProgram,
  updateProgram,
} from "@/modules/academics/program-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ programId: string }>;
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
    const context = await getCurrentRequestContext();
    const { programId } = await params;
    const body = await request.json();
    const program = await updateProgram(
      context,
      programId,
      body,
    );

    return NextResponse.json({ program });
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
    const { programId } = await params;
    const program = await archiveProgram(
      context,
      programId,
    );

    return NextResponse.json({ program });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
