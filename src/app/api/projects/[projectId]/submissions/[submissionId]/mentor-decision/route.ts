import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {decideMentorFinalDelivery} from "@/modules/projects/mentor-final-delivery-decision-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
  from "@/modules/projects/mentor-command-body";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{
 params:Promise<{projectId:string;submissionId:string}>,
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,submissionId}=await params;
  return NextResponse.json(await decideMentorFinalDelivery(await getCurrentRequestContext(),
   projectId,submissionId,await readMentorProjectCommandBody(request)));
 }catch(error){if(error instanceof MentorProjectCommandBodyError)
    return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
      {status:error.status});
  return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
