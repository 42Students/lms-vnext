import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {postMentorProjectUpdate} from "@/modules/projects/mentor-project-update-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{projectId:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {projectId}=await params;
    // Enforce the four-kilobyte budget DURING streamed decoding, not
    // after request.text() has already buffered an untrusted payload.
    const body=await readMentorProjectCommandBody(request,4096);
    const posted=await postMentorProjectUpdate(await getCurrentRequestContext(),projectId,body);
    return NextResponse.json({id:posted.id,message:"Project update posted"},{status:201,
      headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof MentorProjectCommandBodyError){
      return NextResponse.json({
        error:error.status===413?"UPDATE_TOO_LONG":
          error.status===400?"INVALID_JSON":error.code,
        message:mentorProjectBodyFailureMessage(error.status),
      },{status:error.status,headers:{"Cache-Control":"no-store"}});
    }
    return apiErrorResponse(error);
  }
}
