import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { correctAdminAttendance } from "@/modules/attendance/admin-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { scheduleEventId } = params;
    const body = await boundedRequestJson(request);
    const result =
      await correctAdminAttendance(
        context,
        scheduleEventId,
        body,
      );
    return NextResponse.json({ result });
  },
);
