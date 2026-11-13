import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {cancelCollegeHallBooking,CollegeHallCancelError}
  from "@/modules/academics/college-hall-cancel-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {hallId,sessionId}=params;
return NextResponse.json({session:await cancelCollegeHallBooking(
      __ctx,hallId,sessionId,await boundedRequestJson(request),
    )});
} catch(error){
    if(error instanceof CollegeHallCancelError)
      return NextResponse.json({error:error.code},{
        status:error.code==="HALL_SESSION_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
  },
);
