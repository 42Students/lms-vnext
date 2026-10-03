import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectResource,
  listProjectResources,
} from "@/modules/projects/resource-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const resources = await listProjectResources(
      context,
      projectId,
    );

    return NextResponse.json({ resources });
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
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const body = await request.json();
    const resource = await createProjectResource(
      context,
      projectId,
      body,
    );

    return NextResponse.json(
      { resource },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
