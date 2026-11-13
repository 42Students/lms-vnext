import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {completeMentorProject} from "@/modules/projects/mentor-closeout-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const updated=await completeMentorProject(context,{projectId},await boundedRequestJson(request));
    return NextResponse.json({projectId:updated.id,status:updated.status});
  },
);
