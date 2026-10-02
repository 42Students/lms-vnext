import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveSection,
  updateSection,
} from "@/modules/academics/section-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sectionId: string }>;
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
    const { sectionId } = await params;
    const body = await request.json();
    const section = await updateSection(
      context,
      sectionId,
      body,
    );

    return NextResponse.json({ section });
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
    const { sectionId } = await params;
    const section = await archiveSection(
      context,
      sectionId,
    );

    return NextResponse.json({ section });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
