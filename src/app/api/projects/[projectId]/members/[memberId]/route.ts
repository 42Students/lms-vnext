import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  endProjectMember,
  updateProjectMember,
} from "@/modules/projects/member-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    memberId: string;
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
    const context = await getCurrentRequestContext();
    const { projectId, memberId } = await params;
    const body = await request.json();
    const member = await updateProjectMember(
      context,
      projectId,
      memberId,
      body,
    );

    return NextResponse.json({ member });
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
    const { projectId, memberId } = await params;
    const member = await endProjectMember(
      context,
      projectId,
      memberId,
    );

    return NextResponse.json({ member });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
