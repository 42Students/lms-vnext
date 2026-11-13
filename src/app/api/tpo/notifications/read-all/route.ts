import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseTpoNotificationReadBody } from "@/modules/activity/tpo-notifications-model";
import { markAllOwnTpoNotificationsRead } from "@/modules/activity/tpo-notifications-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const decoded=await readBoundedUtf8Body(request,512);
    if (decoded.kind!=="OK") return NextResponse.json(
      {error:"INVALID_BODY"},{status:decoded.kind==="TOO_LARGE"?413:400,
        headers:{"Cache-Control":CACHE.PRIVATE}},
    );
    parseTpoNotificationReadBody(decoded.body);
    return NextResponse.json(await markAllOwnTpoNotificationsRead(context));
  },
);
