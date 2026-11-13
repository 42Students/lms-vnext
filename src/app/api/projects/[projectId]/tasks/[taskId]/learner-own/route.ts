import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId,taskId}=params;
    const result=await deleteLearnerOwnTask(__ctx,{projectId},taskId);
    return privateJson(result);
  },
);
