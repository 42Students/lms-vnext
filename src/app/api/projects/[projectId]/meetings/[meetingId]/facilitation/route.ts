import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
 mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {updateMentorMeetingFacilitation} from
 "@/modules/projects/mentor-meeting-notes-service";
export const runtime="nodejs";
type Context={params:Promise<{projectId:string;meetingId:string}>};
export async function PATCH(request:Request,{params}:Context){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const [context,path]=await Promise.all([getCurrentRequestContext(),params]);
  const result=await updateMentorMeetingFacilitation(context,path,
    await readMentorProjectCommandBody(request));
  return NextResponse.json({meeting:result},{
    headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){
  if(error instanceof MentorProjectCommandBodyError)
   return NextResponse.json({error:error.code,
    message:mentorProjectBodyFailureMessage(error.status)},
    {status:error.status});
  return apiErrorResponse(error);
 }
}
