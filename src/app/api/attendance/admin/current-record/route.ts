import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getAdminCurrentAttendanceRecord } from "@/modules/attendance/admin-service";

export const runtime = "nodejs";

/** Scopes both event and learner through the selected college delivery. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const search = new URL(request.url).searchParams;
    const record = await getAdminCurrentAttendanceRecord(context, {
      collegeId: search.get("collegeId"),
      deliveryId: search.get("deliveryId"),
      scheduleEventId: search.get("scheduleEventId"),
      membershipId: search.get("membershipId"),
    });
    return NextResponse.json(record, {
      headers: {"Cache-Control":"private, no-store"},
    });
  },
);
