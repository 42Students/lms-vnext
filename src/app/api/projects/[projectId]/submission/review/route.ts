import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {reviewProjectSubmissionInputSchema} from "@/modules/projects/validation";
import {listProjectSubmissions,reviewProjectSubmission} from "@/modules/projects/submission-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const context=await getCurrentRequestContext();
  const raw=await request.json() as Record<string,unknown>;
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
 }catch(error){return apiErrorResponse(error);}
}
