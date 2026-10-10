import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { duplicateProjectTemplate } from "@/modules/projects/template-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ templateId: string }>;
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
    const { templateId } = await params;
    const raw = await request.text();
    const body = raw
      ? JSON.parse(raw)
      : {};
    const result =
      await duplicateProjectTemplate(
        context,
        templateId,
        body,
      );
    return NextResponse.json(
      result,
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
