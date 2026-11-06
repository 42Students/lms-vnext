import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listLegacyProjectTasks} from "@/modules/projects/legacy-workspace-task-query";
export const runtime="nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const q=new URL(request.url).searchParams;
    const taskQuery={
   lane:q.get("lane")??"ALL",
   priority:q.get("priority")??"ALL",
   ...(q.has("assigneeId")?{assigneeId:q.get("assigneeId")}:{}),
   sprintScope:q.get("sprintScope")??"ALL",
   page:q.get("page")??"1",size:q.get("size")??"50",
  };
    const data=await listLegacyProjectTasks(
   __ctx,projectId,taskQuery);
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  },
);
