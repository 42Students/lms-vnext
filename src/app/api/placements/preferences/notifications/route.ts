import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";

export const runtime="nodejs";

export async function PUT(request:Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const context=await getCurrentRequestContext();
    const preferences=await updateOwnPlacementNotificationPreferences(context,await request.json());
    return NextResponse.json({preferences});
  } catch(error) {
    return apiErrorResponse(error);
  }
}
