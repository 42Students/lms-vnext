import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listOwnRecruiterPendingInvites} from "@/modules/placements/recruiter-pending-invites-service";
export const runtime="nodejs";
export async function GET(){
 try{
  return NextResponse.json(await listOwnRecruiterPendingInvites(
   await getCurrentRequestContext()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof Error&&error.message==="PENDING_RECRUITER_ACCESS_DENIED")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  throw error;
 }
}
