import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {cancelCollegeHallBooking,CollegeHallCancelError}
  from "@/modules/academics/college-hall-cancel-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {hallId,sessionId}=params;
    return NextResponse.json({session:await cancelCollegeHallBooking(
      __ctx,hallId,sessionId,await request.json(),
    )});
  },
);
