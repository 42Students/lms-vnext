import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {tpoCrmApiErrorResponse} from "@/lib/tpo-crm-api-error";
import {rescheduleConfirmedTpoFollowup} from "@/modules/placements/tpo-followup-queue-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{followupId:string}>};
export async function POST(request:Request,{params}:RouteContext){
 if(process.env["DB09_TPO_API_READY"]!=="DB09_VERIFIED")
  return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {followupId}=await params;
  const result=await rescheduleConfirmedTpoFollowup(context,followupId,await request.json());
  return NextResponse.json({followup:result});
 }catch(error){return tpoCrmApiErrorResponse(error);}
}
