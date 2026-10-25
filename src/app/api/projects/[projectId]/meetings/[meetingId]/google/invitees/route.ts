import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listMentorGoogleInvitees} from
 "@/modules/projects/mentor-google-meeting-sync-service";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
/** Current assigned Mentor only; reveal a bounded roster of names and opaque
 * membership IDs, never addresses, tokens, or historic project members.
 */
export async function GET(_request:Request,{params}:Params){
 try{
  const {projectId,meetingId}=await params;
  const result=await listMentorGoogleInvitees(
   await getCurrentRequestContext(),projectId,meetingId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
