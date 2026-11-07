import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {reorderProjectResources} from "@/modules/projects/resource-service";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const payload:unknown=await boundedRequestJson(request);
    const result=await reorderProjectResources(context,projectId,payload);
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  },
);
