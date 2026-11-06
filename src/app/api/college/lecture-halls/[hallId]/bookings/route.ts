import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeHallBooking, CollegeHallBookingError } from "@/modules/academics/college-hall-booking-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {hallId} = params;
    const booking = await createCollegeHallBooking(__ctx,hallId,await request.json());
    return NextResponse.json({booking},{status:201});
  },
);
