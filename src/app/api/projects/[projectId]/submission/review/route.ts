import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {reviewProjectSubmissionInputSchema} from "@/modules/projects/validation";
import {listProjectSubmissions,reviewProjectSubmission} from "@/modules/projects/submission-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const raw=await boundedRequestJson(request) as Record<string,unknown>;
    const body=raw["delivery"]&&typeof raw["delivery"]==="object"&&!Array.isArray(raw["delivery"])
    ?raw["delivery"] as Record<string,unknown>:raw;
    const result=await listProjectSubmissions(context,projectId);
    const latest=result.submissions[result.submissions.length-1];
    if(!latest||typeof body["version"]!=="number"||body["version"]!==latest.version||
     typeof body["expectedUpdatedAt"]!=="string")
    throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
    const action=body["submitAction"]??body["decision"];
    const decision=action==="REQUEST_CHANGES"?"CHANGES_REQUESTED":action;
    const validated=reviewProjectSubmissionInputSchema.parse({
    decision,feedback:body["feedback"],
    expectedVersion:latest.version,
    expectedUpdatedAt:body["expectedUpdatedAt"],
  });
    const reviewed=await reviewProjectSubmission(context,projectId,latest.id,validated);
    return NextResponse.json({message:"Project delivery reviewed",review:reviewed});
  },
);
