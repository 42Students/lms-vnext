import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {isSameOriginRequest} from "@/auth/origin";
import {updateCollegeProjectSummary} from "@/modules/projects/college-project-summary-service";
import {
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    const { projectId } = params;
    const workspace =
      await getProjectInstanceWorkspace(
        context,
        projectId,
      );
    return NextResponse.json({ workspace });
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const input:unknown=await boundedRequestJson(request);
    if(input && typeof input==="object" && !Array.isArray(input) &&
     ["releases","sprints","tasks","resources","sectionTokens","sections"].some(
      key=>Object.prototype.hasOwnProperty.call(input,key)))
   return NextResponse.json({error:"USE_VERSIONED_SECTION_ENDPOINTS"},{status:400});
    const updated=await updateCollegeProjectSummary(__ctx,projectId,input);
    return NextResponse.json({project:updated,message:"Project updated"},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
