import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {respondToOwnRecruiterPendingInvite} from "@/modules/placements/recruiter-pending-invites-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
 params:Promise<{grantId:string}>;
}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {grantId}=await params;
 const body:unknown=await request.json().catch(()=>null);
 try{
  return NextResponse.json(await respondToOwnRecruiterPendingInvite(
   await getCurrentRequestContext(),grantId,body),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if(code==="PENDING_RECRUITER_ACCESS_DENIED")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(code==="PENDING_RECRUITER_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(code==="PENDING_RECRUITER_STALE"||code==="PENDING_RECRUITER_INVALID_STATE")
   return NextResponse.json({error:"STALE_INVITE"},{status:409});
  if(code==="PENDING_RECRUITER_EXPIRED")
   return NextResponse.json({error:"INVITE_EXPIRED"},{status:409});
  if(error instanceof Error&&error.name==="ZodError")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  throw error;
 }
}
