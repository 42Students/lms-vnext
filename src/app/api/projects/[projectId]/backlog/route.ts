import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveMentorBacklogTask,createMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const result=await moveMentorBacklogTask(__ctx,projectId,await boundedRequestJson(request));
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const task=await createMentorBacklogTask(__ctx,projectId,await boundedRequestJson(request));
    return NextResponse.json({task},{status:201,headers:{"Cache-Control":"private, no-store"}});
  },
);
