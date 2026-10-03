import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectTemplate,
  listAssignedProjectTemplates,
  listProjectTemplates,
} from "@/modules/projects/template-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(
      request.url,
    ).searchParams.get("collegeId");
    const templates = collegeId
      ? await listAssignedProjectTemplates(
          context,
          collegeId,
        )
      : await listProjectTemplates(context);

    return NextResponse.json({ templates });
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
    const result = await createProjectTemplate(
      context,
      body,
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
