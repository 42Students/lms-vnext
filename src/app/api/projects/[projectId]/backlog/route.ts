import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveMentorBacklogTask,createMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const result=await moveMentorBacklogTask(__ctx,projectId,await boundedRequestJson(request));
    return privateJson(result);
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const task=await createMentorBacklogTask(__ctx,projectId,await boundedRequestJson(request));
    return privateJson({task}, { status: 201 });
  },
);
