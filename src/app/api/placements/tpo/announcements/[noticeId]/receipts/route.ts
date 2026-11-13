import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoNoticeReadSummary} from "@/modules/announcements/tpo-notice-read-receipts-service";
import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const result=await getTpoNoticeReadSummary(__ctx,(params).noticeId);
    if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404});
    return noStoreJson(result);
  },
);
