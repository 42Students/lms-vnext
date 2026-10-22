import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveLegacyMeetingKeyLink}
 from "@/modules/projects/legacy-meeting-link-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Params={params:Promise<{projectId:string;meetingKey:string}>};

/** Old stable `projectId+meetingKey` links only resolve within a currently
 * permitted project; an archived or cross-college key cannot leak metadata.
 * The response holds an authorized UUID but no private facilitation notes.
 */
export async function GET(_request:Request,{params}:Params){
 try{
  const {projectId,meetingKey}=await params;
  const result=await resolveLegacyMeetingKeyLink(
   await getCurrentRequestContext(),projectId,meetingKey);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
