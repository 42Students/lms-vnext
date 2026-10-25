import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {checkMentorGoogleMeeting,syncMentorGoogleMeeting,
 removeCancelledMentorGoogleMeeting}
 from "@/modules/projects/mentor-google-meeting-sync-service";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
const inputSchema=z.strictObject({
 weeklyCount:z.number().int().min(2).max(52).optional(),
});
export async function GET(_request:Request,{params}:Params){
 try{
  const {projectId,meetingId}=await params;
  const status=await checkMentorGoogleMeeting(
   await getCurrentRequestContext(),projectId,meetingId);
  return NextResponse.json(status,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw=await request.text();
  if(raw.length>256)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  const input=inputSchema.safeParse(JSON.parse(raw||"{}"));
  if(!input.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const {projectId,meetingId}=await params;
  const result=await syncMentorGoogleMeeting(await getCurrentRequestContext(),
   projectId,meetingId,input.data.weeklyCount);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof SyntaxError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return apiErrorResponse(error);
 }
}

/** Explicitly retract an already-cancelled meeting from the consented
 * Google account. This does not cancel an active local meeting.
 */
export async function DELETE(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,meetingId}=await params;
  const result=await removeCancelledMentorGoogleMeeting(
   await getCurrentRequestContext(),projectId,meetingId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
