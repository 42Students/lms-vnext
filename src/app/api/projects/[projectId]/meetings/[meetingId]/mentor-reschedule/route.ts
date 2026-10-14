import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rescheduleMentorMeeting} from "@/modules/projects/mentor-meeting-reschedule-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string;meetingId:string}>};
export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const [context,path]=await Promise.all([getCurrentRequestContext(),params]);
    const meeting=await rescheduleMentorMeeting(context,path,await request.json());
    return NextResponse.json({meeting});
  }catch(error){return apiErrorResponse(error);}
}
