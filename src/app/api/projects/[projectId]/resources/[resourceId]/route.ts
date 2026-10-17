import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveProjectResource,
  updateProjectResource,
} from "@/modules/projects/resource-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    resourceId: string;
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
    const { projectId, resourceId } =
      await params;
    const body = await request.json();
    const resource = await updateProjectResource(
      context,
      projectId,
      resourceId,
      body,
    );

    return NextResponse.json({ resource });
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
    const { projectId, resourceId } =
      await params;
    const body: unknown=await request.json().catch(()=>({}));
    const resource = await archiveProjectResource(
      context,
      projectId,
      resourceId,
      body,
    );

    return NextResponse.json({ resource });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
