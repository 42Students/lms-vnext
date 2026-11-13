import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {listProjectTaskComments,postProjectTaskComment} from "@/modules/projects/task-comment-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {projectId,taskId}=params;
    return NextResponse.json({comments:await listProjectTaskComments(context,projectId,taskId),
  message:"Project task comments retrieved"},{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId,taskId}=params;
    const comment=await postProjectTaskComment(context,projectId,taskId,await boundedRequestJson(request));
    return NextResponse.json({comment,message:"Project task comment added",refreshComments:true},{status:201});
  },
);
