import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";
import {readLimitedProjectLockInput} from "@/modules/projects/admin-lock-request-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string;submissionId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  // Reject oversized or malformed JSON before looking up the actor.
  // The streaming reader caps actual bytes, not just the advertised size.
  const command=await readLimitedProjectLockInput(request);
  if(!command.ok)
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const {projectId,submissionId}=await params;
  const submission=await lockAdminProjectSubmission(await getCurrentRequestContext(),
   projectId,submissionId,command.value);
  return NextResponse.json({submission},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
