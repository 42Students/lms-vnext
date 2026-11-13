import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {applyTpoWholeRound,getTpoRoundApplyPreview} from "@/modules/placements/tpo-round-apply-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;roundId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,roundId}=params;
    const data=await getTpoRoundApplyPreview(__ctx,jobId,roundId);
    return NextResponse.json({
    ...data,contract:"PENDING_RESULTS_ONLY",
    legacyPendingRoute:"/api/v1/tpo/rounds/"+roundId+"/results/pending",
    legacyApplyRoute:"/api/v1/tpo/rounds/"+roundId+"/results/apply",
    navigation:{review:"/tpo/jobs/"+jobId+"/rounds/"+roundId+"/results",
      apply:"/api/placements/tpo/jobs/"+jobId+"/rounds/"+roundId+"/apply-all"},
    message:"Review unapplied round results before confirming.",
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const notify=new URL(request.url).searchParams.get("notify");
    if(notify!==null&&notify!=="true"&&notify!=="false")
   return NextResponse.json({error:"INVALID_NOTIFY_FLAG",
    message:"Use notify=true or notify=false."},
    {status:400,headers:{"Cache-Control":CACHE.PRIVATE}});
    const {jobId,roundId}=params;
    const result=await applyTpoWholeRound(__ctx,jobId,roundId,await boundedRequestJson(request),notify!=="false");
    return NextResponse.json({...result,notify:notify!=="false",notificationChannel:notify==="false"?"SUPPRESSED":"IN_APP",
    contract:"PENDING_RESULTS_ONLY",requiresReload:true,
    message:"Pending round results applied. Refresh to review any remaining decisions."},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
