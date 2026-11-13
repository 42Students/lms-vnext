import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  cancelSectionScheduleEvent,
  updateSectionScheduleEvent,
} from "@/modules/academics/schedule-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { eventId } = params;
    const body = await boundedRequestJson(request);
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
  },
);
