import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markOwnTpoNoticeRead} from "@/modules/announcements/tpo-notice-read-receipts-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const value=await markOwnTpoNoticeRead(__ctx,(params).noticeId);
    return NextResponse.json({...value,acknowledged:value.read,
    noDeliveredReceipt:!value.read},{
    headers:{"Cache-Control":"no-store"},
  });
  },
);
