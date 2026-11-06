import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getAttendanceParentSmsReadiness } from "@/modules/attendance/parent-sms-service";

export const runtime = "nodejs";

/** Returns consent state only. Phone, evidence reference and SMS body stay private. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const search = new URL(request.url).searchParams;
    const status = await getAttendanceParentSmsReadiness(context, {
      collegeId: search.get("collegeId"),
      membershipId: search.get("membershipId"),
    });
    return NextResponse.json(status, {
      headers: {"Cache-Control":"private, no-store"},
    });
  },
);
