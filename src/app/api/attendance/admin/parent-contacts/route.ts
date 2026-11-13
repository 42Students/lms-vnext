import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {recordVerifiedAttendanceParentContact,revokeAttendanceParentContact} from "@/modules/attendance/parent-sms-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await recordVerifiedAttendanceParentContact(
   __ctx,await boundedRequestJson(request));
    return privateJson(result);
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await revokeAttendanceParentContact(
   __ctx,await boundedRequestJson(request));
    return privateJson(result);
  },
);
