import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {reorderProjectResources} from "@/modules/projects/resource-service";

import { noStoreJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const payload:unknown=await boundedRequestJson(request);
    const result=await reorderProjectResources(context,projectId,payload);
    return noStoreJson(result);
  },
);
