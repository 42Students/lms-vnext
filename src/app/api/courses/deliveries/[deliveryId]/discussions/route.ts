import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseDiscussionMessage,
  listCourseDiscussionMessages,
} from "@/modules/courses/discussion-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    deliveryId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { deliveryId } = await params;
    const result =
      await listCourseDiscussionMessages(
        context,
        deliveryId,
      );

    return NextResponse.json({
      accessMode: result.accessMode,
      canPost: result.canPost,
      messages: result.messages,
    });
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
    const context =
      await getCurrentRequestContext();
    const { deliveryId } = await params;
    const message =
      await createCourseDiscussionMessage(
        context,
        deliveryId,
        await request.json(),
      );

    return NextResponse.json(
      { message },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
