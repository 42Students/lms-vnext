import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createAdminTaskPlanItem} from "@/modules/projects/admin-task-plan-create-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const body:unknown=await boundedRequestJson(request);
    const result=await createAdminTaskPlanItem(
   __ctx,projectId,body);
    return privateJson(result, { status: 201 });
  },
);
