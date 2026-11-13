import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoApplicantPipeline} from "@/modules/placements/tpo-applicant-pipeline-service";
import {tpoApplicantPipelineParams} from "@/modules/placements/tpo-applicant-pipeline-model";

import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

type Params={params:Promise<{jobId:string}>};
async function read(context:Awaited<ReturnType<typeof getCurrentRequestContext>>,
 jobId:string,raw:Record<string,string>){
 const {mode,...filters}=raw;
 if(mode!==undefined&&mode!=="stats"&&mode!=="search")
  throw new Error("INVALID_APPLICATION_QUERY_MODE");
 const input=tpoApplicantPipelineParams.parse({jobId,...filters});
 const data=await getTpoApplicantPipeline(context,input);
 return mode==="stats"?
  {message:"Stats retrieved",jobId:data.job.id,stats:data.counts,totalMatching:data.totalMatching,
   refreshed:false,cache:"LIVE_DATABASE"}:
  {message:"Applications retrieved",jobId:data.job.id,records:data.rows,stats:data.counts,
   totalMatching:data.totalMatching,page:data.page,totalPages:data.totalPages,
   refreshed:false,cache:"LIVE_DATABASE"};
}
/** Scoped replacement for legacy job-application search and stats.
 * No caller can provide organizationId or widen the selected college. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const raw:Record<string,string>={};
    for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(raw,key))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
   raw[key]=value;
  }
    const value=await read(__ctx,jobId,raw);
    return privateJson(value);
  },
);
/** No refresh cache exists. Re-read the actual scoped pipeline and report
 * that the persisted database was queried, never imply a stale cache was invalidated. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const payload:unknown=await boundedRequestJson(request).catch(()=>({}));
    if(!payload||typeof payload!=="object"||Array.isArray(payload))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const raw=payload as Record<string,unknown>;
    if(Object.keys(raw).some(key=>key!=="mode"&&key!=="action")||
     raw["action"]!=="REFRESH"||raw["mode"]!==undefined&&raw["mode"]!=="stats")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const value=await read(__ctx,jobId,{mode:"stats"});
    return NextResponse.json({...value,message:"Live application statistics retrieved",
   refreshed:false,reason:"Applications are read directly from the database; no refresh is required."},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
