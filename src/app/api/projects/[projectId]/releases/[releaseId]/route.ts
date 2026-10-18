import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
export const runtime="nodejs";
type Route={params:Promise<{projectId:string;releaseId:string}>};
export async function PATCH(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,releaseId}=await params;
  const result=await writeMentorProjectRelease(await getCurrentRequestContext(),projectId,releaseId,"PATCH",await readMentorProjectCommandBody(request));
  return NextResponse.json(result);
 }catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
export async function DELETE(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,releaseId}=await params;
  const result=await writeMentorProjectRelease(await getCurrentRequestContext(),projectId,releaseId,"DELETE",await readMentorProjectCommandBody(request));
  return NextResponse.json(result);
 }catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
