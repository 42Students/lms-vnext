import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {remindUnreadTpoNotice} from "@/modules/announcements/tpo-notice-reminder-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const result=await remindUnreadTpoNotice(__ctx,(params).noticeId);
    return NextResponse.json(result);
  },
);
