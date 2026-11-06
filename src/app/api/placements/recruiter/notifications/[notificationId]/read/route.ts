import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markHrNotificationRead} from "@/modules/placements/hr-notification-read-service";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {notificationId}=params;
    const raw:unknown=await readRecruiterJsonBody(request);
    const result=await markHrNotificationRead(context,notificationId,raw);
    return NextResponse.json({notification:result});
  },
);
