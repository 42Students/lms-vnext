import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveProjectResourceLibrary} from "@/modules/projects/project-resource-library-service";

export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const input:unknown=await boundedRequestJson(request);
    const result=await saveProjectResourceLibrary(__ctx,projectId,input);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
