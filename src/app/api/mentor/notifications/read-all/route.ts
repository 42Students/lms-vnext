import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseMentorNotificationReadBody } from "@/modules/activity/mentor-notification-read-input";
import { markAllOwnMentorNotificationsRead } from "@/modules/activity/mentor-notification-read-service";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const decoded=await readBoundedUtf8Body(request,512);
    if(decoded.kind!=="OK")return NextResponse.json({error:"INVALID_BODY"},
      {status:decoded.kind==="TOO_LARGE"?413:400,
       headers:{"Cache-Control":"private, no-store"}});
    parseMentorNotificationReadBody(decoded.body);
    const result=await markAllOwnMentorNotificationsRead(context);
    return NextResponse.json(result);
  },
);
