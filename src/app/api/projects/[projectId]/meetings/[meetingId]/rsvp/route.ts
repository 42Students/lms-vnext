import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {apiErrorResponse} from "@/lib/api-error";
import {respondToProjectMeeting} from
 "@/modules/projects/mentor-meeting-rsvp-service";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
async function handlePOST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const parsed=await readBoundedJsonRequest(request,1024);
 if(!parsed.ok)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const {projectId,meetingId}=await params;
  const result=await respondToProjectMeeting(
   await getCurrentRequestContext(),projectId,meetingId,parsed.value);
  return privateJson(result);
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
