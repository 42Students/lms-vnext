import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { learnerDiscussionListResponse } from "@/modules/courses/learner-discussion-response-model";
import {
  createCourseDiscussionMessage,
  listCourseDiscussionMessages,
} from "@/modules/courses/discussion-service";

export const runtime = "nodejs";

/** This is a DELIVERY-scoped discussion feed, not the legacy
 * /api/v1/discussion/fetchDiscussion or /post lesson-content thread.
 * Legacy lessonContentId must be mapped through an authorized content read;
 * never silently post to a whole course when a lesson target was requested.
 * Existing vNext clients consume structured paginated GET data and a
 * persisted {message} receipt (201), so don't replace either response with
 * the older 200 Response(OK,OK,...) envelope on this route.
 */
const noStore={"Cache-Control":"private, no-store"};

type RouteContext = {
  params: Promise<{
    deliveryId: string;
  }>;
};

export async function GET(
  request: Request,
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
        Object.fromEntries(new URL(request.url).searchParams.entries()),
      );

    return NextResponse.json(learnerDiscussionListResponse(result), {
      headers: noStore,
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
      { status: 201, headers: noStore },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
