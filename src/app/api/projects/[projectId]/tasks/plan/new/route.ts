import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createAdminTaskPlanItem} from "@/modules/projects/admin-task-plan-create-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const body:unknown=await request.json();
    const result=await createAdminTaskPlanItem(
   __ctx,projectId,body);
    return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
  },
);
