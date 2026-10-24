import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {apiErrorResponse} from "@/lib/api-error";
import {respondToProjectMeeting} from
 "@/modules/projects/mentor-meeting-rsvp-service";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const parsed=await readBoundedJsonRequest(request,1024);
 if(!parsed.ok)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const {projectId,meetingId}=await params;
  const result=await respondToProjectMeeting(
   await getCurrentRequestContext(),projectId,meetingId,parsed.value);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
