import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId,taskId}=params;
    const result=await deleteLearnerOwnTask(__ctx,{projectId},taskId);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
