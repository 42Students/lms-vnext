import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {applyTpoWholeRound,getTpoRoundApplyPreview} from "@/modules/placements/tpo-round-apply-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;roundId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{const {jobId,roundId}=await params;
  const data=await getTpoRoundApplyPreview(await getCurrentRequestContext(),jobId,roundId);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const notify=new URL(request.url).searchParams.get("notify");
  if(notify!==null&&notify!=="true"&&notify!=="false")
   return NextResponse.json({error:"INVALID_NOTIFY_FLAG",
    message:"Use notify=true or notify=false."},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  // The result-service currently records a learner in-app notification in
  // the same transaction as each applied result. Refuse unsupported opt-out
  // before any partial mutation instead of quietly notifying despite false.
  if(notify==="false")return NextResponse.json({
   error:"NOTIFICATION_SUPPRESSION_UNAVAILABLE",
   message:"This action currently notifies learners when results are applied. Notification-free apply is not available.",
  },{status:422,headers:{"Cache-Control":"private, no-store"}});
  const {jobId,roundId}=await params;
  const result=await applyTpoWholeRound(await getCurrentRequestContext(),jobId,roundId,await request.json());
  return NextResponse.json({...result,notify:true,notificationChannel:"IN_APP"},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
