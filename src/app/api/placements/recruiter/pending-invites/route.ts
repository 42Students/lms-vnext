import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listSignedInRecruiterPendingInvites} from "@/modules/placements/public-recruiter-invite-accept-service";
export const runtime="nodejs";
export async function GET(){
 try{
  return NextResponse.json(await listSignedInRecruiterPendingInvites(await getCurrentRequestContext()),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
