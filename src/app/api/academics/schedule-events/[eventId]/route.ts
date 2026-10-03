import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  cancelSectionScheduleEvent,
  updateSectionScheduleEvent,
} from "@/modules/academics/schedule-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ eventId: string }>;
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
    const { eventId } = await params;
    const body = await request.json();
    const event =
      body &&
      typeof body === "object" &&
      "action" in body
        ? await cancelSectionScheduleEvent(
            context,
            eventId,
            body,
          )
        : await updateSectionScheduleEvent(
            context,
            eventId,
            body,
          );

    return NextResponse.json({ event });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
