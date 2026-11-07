import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeHallBooking, CollegeHallBookingError } from "@/modules/academics/college-hall-booking-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {hallId} = params;
const booking = await createCollegeHallBooking(__ctx,hallId,await request.json());
return NextResponse.json({booking},{status:201});
} catch(error) {
    if (error instanceof CollegeHallBookingError) return NextResponse.json({error:error.code},{
      status:["HALL_NOT_FOUND","SECTION_NOT_FOUND","FACULTY_NOT_FOUND"].includes(error.code)?404:409,
    });
    return apiErrorResponse(error);
  }
  },
);
