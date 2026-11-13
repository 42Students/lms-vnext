import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {postFacultyDiscussionReply} from "@/modules/courses/faculty-discussion-reply-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {deliveryId}=params;
    const message=await postFacultyDiscussionReply(__ctx,
   deliveryId,await boundedRequestJson(request));
    return NextResponse.json({message},{status:201});
  },
);
