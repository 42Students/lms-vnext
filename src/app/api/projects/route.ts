import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectInstance,
  listProjectInstances,
} from "@/modules/projects/instance-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      ) ?? "";
    const projects = await listProjectInstances(
      context,
      collegeId,
    );

    return NextResponse.json({ projects });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const project = await createProjectInstance(
      context,
      body,
    );

    return NextResponse.json(
      { project },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
