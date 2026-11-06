import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
  from "@/modules/projects/mentor-command-body";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{
 params:Promise<{projectId:string;meetingId:string}>,
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,meetingId}=await params;
  const meeting=await decideMentorProjectMeeting(await getCurrentRequestContext(),
   projectId,meetingId,await readMentorProjectCommandBody(request));
  return NextResponse.json({meeting});
 }catch(error){if(error instanceof MentorProjectCommandBodyError)
    return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
      {status:error.status});
  return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
