import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {parseMentorNotificationReadBody} from
  "@/modules/activity/mentor-notification-read-input";
import {markVisibleMentorSourcesRead} from
  "@/modules/projects/mentor-notification-source-receipts-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";

/** Mark only current, verified visible Mentor source notifications.
 * Personal in-app notifications have their own full, cursor-safe endpoint.
 */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const body=await request.text();
    if(body.length>256)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
    parseMentorNotificationReadBody(body);
    const result=await markVisibleMentorSourcesRead(__ctx);
    return privateJson(result);
  },
);
