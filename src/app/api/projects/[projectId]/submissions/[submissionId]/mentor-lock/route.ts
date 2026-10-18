import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {lockMentorFinalDelivery} from "@/modules/projects/mentor-delivery-lock-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string;submissionId:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,submissionId}=await params;
  const submission=await lockMentorFinalDelivery(await getCurrentRequestContext(),projectId,
   submissionId,await readMentorProjectCommandBody(request));
  return NextResponse.json({submission});
 }catch(error){if(error instanceof MentorProjectCommandBodyError)
  return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
   {status:error.status});
 return apiErrorResponse(error);}
}
