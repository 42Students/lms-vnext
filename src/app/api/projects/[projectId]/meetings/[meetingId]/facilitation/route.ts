import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
 mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {updateMentorMeetingFacilitation} from
 "@/modules/projects/mentor-meeting-notes-service";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type Context={params:Promise<{projectId:string;meetingId:string}>};
async function handlePATCH(request:Request,{params}:Context){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const [context,path]=await Promise.all([getCurrentRequestContext(),params]);
  const result=await updateMentorMeetingFacilitation(context,path,
    await readMentorProjectCommandBody(request));
  return NextResponse.json({meeting:result},{
    headers:{"Cache-Control":CACHE.PRIVATE},
  });
 }catch(error){
  if(error instanceof MentorProjectCommandBodyError)
   return NextResponse.json({error:error.code,
    message:mentorProjectBodyFailureMessage(error.status)},
    {status:error.status});
  return apiErrorResponse(error);
 }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);
