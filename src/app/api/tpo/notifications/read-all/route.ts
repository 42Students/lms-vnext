import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseTpoNotificationReadBody } from "@/modules/activity/tpo-notifications-model";
import { markAllOwnTpoNotificationsRead } from "@/modules/activity/tpo-notifications-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const decoded=await readBoundedUtf8Body(request,512);
    if (decoded.kind!=="OK") return NextResponse.json(
      {error:"INVALID_BODY"},{status:decoded.kind==="TOO_LARGE"?413:400,
        headers:{"Cache-Control":"private, no-store"}},
    );
    parseTpoNotificationReadBody(decoded.body);
    const context = await getCurrentRequestContext();
    return NextResponse.json(await markAllOwnTpoNotificationsRead(context));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
