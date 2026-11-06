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
    try {
const result=await remindUnreadTpoNotice(__ctx,(params).noticeId);
return NextResponse.json(result);
} catch(e){
  if(e instanceof Error&&e.message.startsWith("NOTICE_"))
   return NextResponse.json({error:e.message},{status:
    e.message==="NOTICE_NOT_FOUND"?404:e.message==="NOTICE_REMINDER_RATE_LIMIT"?429:409});
  return apiErrorResponse(e);
 }
  },
);
