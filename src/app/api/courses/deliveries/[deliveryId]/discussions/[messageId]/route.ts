import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {facultyDiscussionModerationSchema} from "@/modules/courses/faculty-discussion-moderation-model";
import {
  deleteCourseDiscussionMessage,
  toggleCourseDiscussionPin,
} from "@/modules/courses/discussion-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    deliveryId: string;
    messageId: string;
  }>;
};

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
    const { deliveryId, messageId } = await params;
    const version=facultyDiscussionModerationSchema.parse(await request.json());
    const deleted = await deleteCourseDiscussionMessage(
      context,
      messageId,
      deliveryId,
      version,
    );

    return NextResponse.json({ deleted });
  } catch (error) {
    return apiErrorResponse(error);
  }
}


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
    const { deliveryId, messageId } = await params;
    const version=facultyDiscussionModerationSchema.parse(await request.json());
    const message =
      await toggleCourseDiscussionPin(
        context,
        messageId,
        deliveryId,
        version,
      );

    return NextResponse.json({ message });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
