import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{projectId:string;meetingId:string}>,
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,meetingId}=await params;
  const meeting=await decideMentorProjectMeeting(await getCurrentRequestContext(),
   projectId,meetingId,await request.json());
  return NextResponse.json({meeting});
 }catch(error){return apiErrorResponse(error);}
}
