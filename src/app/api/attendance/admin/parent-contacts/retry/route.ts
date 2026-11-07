import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {retryQueuedAttendanceParentSmsForCollege} from "@/modules/attendance/parent-sms-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const input=z.object({collegeId:z.string().uuid()}).strict().parse(await request.json());
    const result=await retryQueuedAttendanceParentSmsForCollege(__ctx,input.collegeId);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
