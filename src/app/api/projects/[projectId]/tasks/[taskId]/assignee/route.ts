import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {assignProjectTask} from "@/modules/projects/task-assignment-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId,taskId}=params;
    return NextResponse.json({task:await assignProjectTask(context,projectId,taskId,await boundedRequestJson(request))});
  },
);
