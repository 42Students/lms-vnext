import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {replaceCollegeProjectLearners} from "@/modules/projects/college-project-roster-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const result=await replaceCollegeProjectLearners(context,projectId,await boundedRequestJson(request));
    return NextResponse.json(result);
  },
);
