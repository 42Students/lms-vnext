import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {retryQueuedAttendanceParentSmsForCollege} from "@/modules/attendance/parent-sms-service";
import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const input=z.object({collegeId:zUuid}).strict().parse(await boundedRequestJson(request));
    const result=await retryQueuedAttendanceParentSmsForCollege(__ctx,input.collegeId);
    return privateJson(result);
  },
);
