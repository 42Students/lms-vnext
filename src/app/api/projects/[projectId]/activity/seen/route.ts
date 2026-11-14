import { route } from "@/security/route";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markMentorProjectActivitySeen} from
 "@/modules/projects/mentor-activity-seen-service";

import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "academics.read" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const id=zUuid.parse(projectId);
    const decoded=await readBoundedUtf8Body(request,256);
    if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
    if(decoded.kind!=="OK"||decoded.body.trim().length)
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
    const result=await markMentorProjectActivitySeen(
    __ctx,id);
    return privateJson(result);
  },
);
