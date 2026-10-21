import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSectionScheduleEvent,
  listSectionScheduleEvents,
} from "@/modules/academics/schedule-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const sectionId =
      new URL(request.url).searchParams.get(
        "sectionId",
      ) ?? "";
    const events =
      await listSectionScheduleEvents(
        context,
        sectionId,
      );

    return NextResponse.json({ events });
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
    const event =
      await createSectionScheduleEvent(
        context,
        body,
      );

    // Keep the vNext event and provide the historic OK acknowledgment.
    return NextResponse.json(
      { event, status: "OK", message: "OK" },
      { status: 201, headers: {"Cache-Control":"private, no-store"} },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
