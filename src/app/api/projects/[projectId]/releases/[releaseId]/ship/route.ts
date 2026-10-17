import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  shipProjectRelease,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    releaseId: string;
  }>;
};

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
    const { projectId, releaseId } = await params;
    const payload:unknown=await request.json().catch(()=>({}));
    const release = await shipProjectRelease(
      context,
      projectId,
      releaseId,
      payload,
    );

    return NextResponse.json({ release });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
