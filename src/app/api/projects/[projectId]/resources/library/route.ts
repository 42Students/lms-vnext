import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveProjectResourceLibrary} from "@/modules/projects/project-resource-library-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const input:unknown=await boundedRequestJson(request);
    const result=await saveProjectResourceLibrary(__ctx,projectId,input);
    return privateJson(result);
  },
);
