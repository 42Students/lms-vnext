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

    // Preserve vNext {templates} and the legacy admin-list envelope.
    return NextResponse.json({ templates, status: "success",
      message: "Project templates retrieved", data: templates, count: templates.length });
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
    const body = await request.json().catch(() => null);
    if (body === null) {
      return NextResponse.json(
        { error: "INVALID_TEMPLATE", message: "Template payload is required" },
        { status: 400 },
      );
    }
    const result = await createProjectTemplate(
      context,
      body,
    );

    return NextResponse.json({ ...result, status: "success",
      message: "Project template created", data: result.template }, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
