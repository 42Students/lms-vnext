import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const result=await writeMentorProjectRelease(await getCurrentRequestContext(),projectId,null,"POST",await readMentorProjectCommandBody(request));
  // Creating a planned release is not shipping one: /ship owns "Release shipped".
  return NextResponse.json({...result,message:"Release added.",success:true},{
   status:201,headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
