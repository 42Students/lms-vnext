import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {listProjectSubmissions,updateProjectSubmissionDraft} from "@/modules/projects/submission-service";
export const runtime="nodejs";
type Ctx={params:Promise<{projectId:string}>};
export async function GET(_request:Request,{params}:Ctx){
 try{
  const {projectId}=await params;
  const result=await listProjectSubmissions(await getCurrentRequestContext(),projectId);
  return NextResponse.json({message:"Project delivery loaded",delivery:result.legacyDelivery,
   history:result.history},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
/** Legacy PUT /submission safely writes the current DRAFT only. It never
 * takes an ID from a non-scoped lookup or silently adopts a newer revision. */
export async function PUT(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const context=await getCurrentRequestContext();
  const raw=await request.json() as Record<string,unknown>;
  const body=raw["delivery"]&&typeof raw["delivery"]==="object"&&!Array.isArray(raw["delivery"])
    ?raw["delivery"] as Record<string,unknown>:raw;
  const result=await listProjectSubmissions(context,projectId);
  const latest=result.submissions[result.submissions.length-1];
  if(!latest||latest.status!=="DRAFT"||typeof body["expectedUpdatedAt"]!=="string"||
     typeof body["submissionId"]!=="string"||body["submissionId"]!==latest.id||
     typeof body["version"]!=="number"||body["version"]!==latest.version)
    throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const updated=await updateProjectSubmissionDraft(context,projectId,latest.id,{
    summary:body["summary"],sourceUrl:body["sourceUrl"],demoUrl:body["demoUrl"],
    notes:body["notes"],attachments:body["attachments"],
    expectedUpdatedAt:body["expectedUpdatedAt"],
  });
  return NextResponse.json({message:"Project delivery updated",submission:updated});
 }catch(error){return apiErrorResponse(error);}
}
