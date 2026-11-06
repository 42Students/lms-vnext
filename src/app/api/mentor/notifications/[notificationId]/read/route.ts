import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseMentorNotificationReadBody } from "@/modules/activity/mentor-notification-read-input";
import { markOwnMentorNotificationRead } from "@/modules/activity/mentor-notification-read-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
type RouteContext={params:Promise<{notificationId:string}>};
async function handlePOST(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request)) return NextResponse.json(
    {error:"INVALID_ORIGIN"},{status:403},
  );
  try {
    parseMentorNotificationReadBody(await request.text());
    const context=await getCurrentRequestContext();
    const {notificationId}=await params;
    const notification=await markOwnMentorNotificationRead(context,notificationId);
    return NextResponse.json({notification});
  } catch(error) {return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
