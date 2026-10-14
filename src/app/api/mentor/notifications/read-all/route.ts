import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markAllOwnMentorNotificationsRead } from "@/modules/activity/mentor-notification-read-service";

export const runtime="nodejs";
export async function POST(request:Request) {
  if(!isSameOriginRequest(request)) return NextResponse.json(
    {error:"INVALID_ORIGIN"},{status:403},
  );
  try {
    const context=await getCurrentRequestContext();
    const result=await markAllOwnMentorNotificationsRead(context);
    return NextResponse.json(result);
  } catch(error) {return apiErrorResponse(error);}
}
