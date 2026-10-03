import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveCourseOffering,
  updateCourseOffering,
} from "@/modules/courses/offering-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ offeringId: string }>;
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
    const { offeringId } = await params;
    const body = await request.json();
    const offering = await updateCourseOffering(
      context,
      offeringId,
      body,
    );

    return NextResponse.json({ offering });
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
    const { offeringId } = await params;
    const offering = await archiveCourseOffering(
      context,
      offeringId,
    );

    return NextResponse.json({ offering });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
