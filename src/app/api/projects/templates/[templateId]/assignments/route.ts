import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  assignProjectTemplateToCollege,
  revokeProjectTemplateFromCollege,
} from "@/modules/projects/template-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

const bodySchema = z
  .object({
    collegeId: z.string().uuid(),
  })
  .strict();

async function parseRequest(
  request: Request,
) {
  return bodySchema.parse(await request.json());
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
    const { templateId } = await params;
    const body = await parseRequest(request);
    const assignment =
      await assignProjectTemplateToCollege(
        context,
        templateId,
        body.collegeId,
      );

    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
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
    const { templateId } = await params;
    const body = await parseRequest(request);
    const assignment =
      await revokeProjectTemplateFromCollege(
        context,
        templateId,
        body.collegeId,
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
