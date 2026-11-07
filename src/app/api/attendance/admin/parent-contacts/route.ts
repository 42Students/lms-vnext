import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {recordVerifiedAttendanceParentContact,revokeAttendanceParentContact} from "@/modules/attendance/parent-sms-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await recordVerifiedAttendanceParentContact(
   __ctx,await boundedRequestJson(request));
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await revokeAttendanceParentContact(
   __ctx,await boundedRequestJson(request));
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
