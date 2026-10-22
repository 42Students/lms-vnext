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
  return NextResponse.json({
    ...data,contract:"PENDING_RESULTS_ONLY",
    legacyPendingRoute:"/api/v1/tpo/rounds/"+roundId+"/results/pending",
    legacyApplyRoute:"/api/v1/tpo/rounds/"+roundId+"/results/apply",
    navigation:{review:"/tpo/jobs/"+jobId+"/rounds/"+roundId+"/results",
      apply:"/api/placements/tpo/jobs/"+jobId+"/rounds/"+roundId+"/apply-all"},
    message:"Review unapplied round results before confirming.",
  },{headers:{"Cache-Control":"private, no-store"}});
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
  // Legacy apply?notify=false: outcomes still advance atomically; only the
  // learner notice is suppressed. Unspecified notify defaults to true.
  const {jobId,roundId}=await params;
  const result=await applyTpoWholeRound(await getCurrentRequestContext(),jobId,roundId,await request.json(),notify!=="false");
  return NextResponse.json({...result,notify:notify!=="false",notificationChannel:notify==="false"?"SUPPRESSED":"IN_APP",
    contract:"PENDING_RESULTS_ONLY",requiresReload:true,
    message:"Pending round results applied. Refresh to review any remaining decisions."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
