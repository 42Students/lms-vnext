import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveOwnLearnerProjectTask} from "@/modules/projects/learner-task-status-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId,taskId}=params;
    const body=await request.json();
    const task=await moveOwnLearnerProjectTask(context,projectId,taskId,body);
    return NextResponse.json({task});
  },
);
